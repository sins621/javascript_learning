export default class API {
  constructor(app) {
    this.app = app;
    this.setupEndpoints();
  }

  async setupEndpoints() {
    this.getUserTable();
  }

  async getUserTable() {
    this.app.get("/", (req, res) => {
      
    });
  }
}
