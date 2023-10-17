class ApiFeatures {
    constructor(query, queryStr) {
      //query = Tour model query from mongoose
      //queryString = url query parameter form express
      this.query = query;
      this.queryStr = queryStr;
    }
  
    filter() {
      //filtering
      const queryObj = { ...this.queryStr };
      const excludeFields = ['page', 'sort', 'limit', 'fields'];
      excludeFields.forEach((el) => delete queryObj[el]);
  
      //advanced filtering
      let str = JSON.stringify(queryObj).replace(
        /\b(lte|lt|gte|gt)\b/g,
        (match) => `$${match}`
      ); 
      this.query.find(JSON.parse(str));
      return this;
    }
  
    sort() {
      if (this.queryStr.sort) {
        const sortBy = this.queryStr.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort('createdAt');
      }
      return this;
    }
  
    limitFields() {
      //Limiting Fields
      if (this.queryStr.fields) {
        this.query = this.query.select(this.queryStr.fields.split(',').join(' '));
      }
      return this;
    }
  
    paginate() {
        //pagination
        const page = this.queryStr.page * 1 || 1;
        const limit = this.queryStr.limit * 1 || 100;
        const skip = (page - 1) * limit;
  
        // if (this.queryStr.page) {
        //   const numTours = await this.query.countDocuments();
        //   if (skip >= numTours)
        //     throw new Error('Number of pages exceeded the result limit');
        // }
        this.query = this.query.skip(skip).limit(limit);
        return this;
      }
}
  
module.exports = ApiFeatures;