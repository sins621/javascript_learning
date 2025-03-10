import pg from "pg";

export default class DatabaseHandler {
  constructor(clientInfo) {
    this.database = new pg.Client(clientInfo);
    this.database.connect();
  }

  async fetchAllBooks() {
    return (await this.database.query("SELECT * FROM books")).rows;
  }

  async fetchBooksBy(filter, value) {
    switch (filter) {
      case "category":
        return (
          await this.database.query(
            `
            SELECT * FROM books
            WHERE category=$1
            `,
            [value]
          )
        ).rows;
      case "id":
        return (
          await this.database.query(
            `
            SELECT * FROM books 
            WHERE id = $1
            `,
            [value]
          )
        ).rows;
    }
  }

  async addBook(bookInfo) {
    return (
      await this.database.query(
        `
      INSERT INTO books 
      (
        title,
        author,
        category,
        publish_year,
        abstract,
        cover_id,
        quantity,
        price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
        bookInfo
      )
    ).rows[0];
  }

  async fetchBookReviews(id) {
    return (
      await this.database.query(
        `
        SELECT * FROM book_reviews
        WHERE book_id = $1
        `,
        [id]
      )
    ).rows;
  }

  async addBookReview(reviewInfo) {
    return (
      await this.database.query(
        `
      INSERT INTO book_reviews (
        review_title,
        reviewer_name,
        review_date,
        review_text,
        user_id,
        review_rating,
        book_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
       `,
        reviewInfo
      )
    ).rows[0];
  }

  async fetchCartItems(userId) {
    return (
      await this.database.query(
        `
        SELECT * FROM carts
        WHERE user_id = $1
        `,
        [userId]
      )
    ).rows;
  }

  async addBookToCart(bookId, userId) {
    const BOOK_INFO = (await this.fetchBooksBy("id", bookId))[0];

    return (
      await this.database.query(
        `
        INSERT INTO public.carts
        (
          book_id,
          user_id,
          book_title,
          book_price,
          book_remaining,
          amount
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (book_id, user_id)
        DO UPDATE SET amount = public.carts.amount + 1
        RETURNING *;
        `,
        [
          bookId,
          userId,
          BOOK_INFO.title,
          BOOK_INFO.price,
          BOOK_INFO.quantity,
          1,
        ]
      )
    ).rows[0];
  }

  async fetchUsersBy(filter, value) {
    switch (filter) {
      case "email":
        return (
          await this.database.query(
            `
            SELECT * FROM users 
            WHERE email = $1
            `,
            [value]
          )
        ).rows;
    }
  }

  async fetchAllUsersRoles() {
    return (
      await this.database.query(
        `
              SELECT email, role,
          CASE
            WHEN role = 'admin' THEN 'admin'
            WHEN role = 'user' THEN 'user'
            ELSE 'other'
          END AS role
        FROM user_roles
          ORDER BY CASE
            WHEN role = 'admin' THEN 1
            WHEN role = 'user' THEN 2
            ELSE 3
          END;
      `
      )
    ).rows;
  }

  async fetchUserByHighestRole(id) {
    return (
      await this.database.query(
        `
        SELECT email, role,
          CASE
            WHEN role = 'admin' THEN 'admin'
            WHEN role = 'user' THEN 'user'
            ELSE 'other'
          END AS role
        FROM user_roles
        WHERE user_id = $1
          ORDER BY CASE
            WHEN role = 'admin' THEN 1
            WHEN role = 'user' THEN 2
            ELSE 3
          END
        LIMIT 1;
        `,
        [id]
      )
    ).rows[0];
  }

  async addUser(email, hash, name) {
    var userTableUser = (
      await this.database.query(
        `
        INSERT INTO users (email, password, name)
        VALUES ($1, $2, $3) RETURNING *
        `,
        [email, hash, name]
      )
    ).rows[0];

    const USER_ROLE_ID = 2;
    const USER_ROLE_NAME = "user";
    var roleTableUser = (
      await this.database.query(
        `
        INSERT INTO user_roles (user_id, role_id, email, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [userTableUser.id, USER_ROLE_ID, email, USER_ROLE_NAME]
      )
    ).rows[0];

    return {
      id: userTableUser.id,
      email: roleTableUser.email,
      role: roleTableUser.role,
      cart: await this.fetchCartItems(roleTableUser.id),
    };
  }

  async addLog({
    event = null,
    object = null,
    description = null,
    createdBy = null,
  } = {}) {
    return await this.database.query(
      `
      INSERT INTO public.logs
      (
        event,
        object,
        description,
        created_on,
        created_by
      )
      VALUES
      ($1, $2, $3, now(), $4)
      RETURNING id
      `,
      [event, object, description, createdBy]
    );
  }

  async fetchSubscribers() {
    return (
      await this.database.query(
        `
      SELECT * FROM public.subscribers
      `
      )
    ).rows;
  }
}
