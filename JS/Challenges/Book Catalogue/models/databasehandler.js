import pg from "pg";

export default class DatabaseHandler {
  constructor(clientInfo) {
    this.database = new pg.Client(clientInfo);
    this.database.connect();
  }

  async fetchBooks(bookInfo) {
    if (!bookInfo) {
      const QUERY = await this.database.query("SELECT * FROM books");
      return QUERY.rows;
    }
    if (bookInfo.category){
      return this.fetchBooksByCategory(bookInfo.category);
    }
  }

  async fetchBooksByCategory(category) {
    const QUERY = await this.database.query(
      `SELECT * FROM books
       WHERE category=$1`,
      [category]
    );
    return QUERY.rows;
  }

  async fetchBook(bookInfo) {
    if (bookInfo.category) {
      return await this.fetchBookByCategory(category);
    }
    if (bookInfo.id) {
      return await this.fetchBookByID(bookInfo.id);
    }
  }

  async fetchBookByCategory(category) {
    const QUERY = await this.database.query(
      `SELECT * FROM books
       WHERE category=$1`,
      [category]
    );
    return QUERY.rows[0];
  }

  async fetchBookByID(id) {
    const QUERY = await this.database.query(
      "SELECT * FROM books WHERE id = $1",
      [id]
    );
    return QUERY.rows[0];
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
    const QUERY = await this.database.query(
      `SELECT * FROM book_reviews
       WHERE book_id = $1`,
      [BOOK_ID]
    );
    return QUERY.rows;
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
}
