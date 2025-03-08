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
            `SELECT * FROM books
             WHERE category=$1`,
            [value]
          )
        ).rows;
      case "id":
        return (
          await this.database.query(
            `SELECT * FROM books 
             WHERE id = $1`,
            [value]
          )
        ).rows;
    }
  }

  async addBook(bookInfo) {
    this.database.query(
      `INSERT INTO books (
         title,
         author,
         category,
         publish_year,
         abstract,
         cover_id,
         quantity,
         price
         )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      bookInfo
    );
  }

  async fetchBookReviews(id) {
    return (
      await this.database.query(
        `SELECT * FROM book_reviews
       WHERE book_id = $1`,
        [id]
      )
    ).rows;
  }

  async addBookReview(reviewInfo) {
    await this.database.query(
      `INSERT INTO book_reviews (
         review_title,
         reviewer_name,
         review_date,
         review_text,
         user_id,
         review_rating,
         book_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      reviewInfo
    );
  }

  async fetchCartItems(userId) {
    return (
      await this.database.query(
        `SELECT * FROM carts
       WHERE user_id = $1`,
        [userId]
      )
    ).rows;
  }

  async addBookToCart(bookId, userId) {
    const BOOK_QUERY = await this.database.query(
      `SELECT * FROM public.carts
       WHERE
         book_id = $1
       AND
         user_id = $2`,
      [bookId, userId]
    );

    if (BOOK_QUERY.rows.length > 0) {
      await this.database.query(
        `UPDATE public.carts
         SET
           amount = $1
         WHERE
           book_id = $2
         AND
           user_id = $3`,
        [BOOK_QUERY.rows[0].amount + 1, bookId, userId]
      );

      return;
    }

    const BOOK_INFO = (await this.fetchBooksBy("id", bookId))[0];
    console.log(BOOK_INFO);
    await this.database.query(
      `INSERT INTO public.carts
     (
       book_id,
       user_id,
       book_title,
       book_price,
       book_remaining,
       amount
     )
     VALUES ($1, $2, $3, $4, $5, $6)`,
      [bookId, userId, BOOK_INFO.title, BOOK_INFO.price, BOOK_INFO.quantity, 1]
    );
  }
}
