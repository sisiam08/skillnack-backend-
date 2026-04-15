import { PaginationOptions } from "../interfaces";

const PaginationHelper = (options: PaginationOptions) => {
  if(options.limit){

    const page: number = Number(options.page);
    const limit: number = Number(options.limit);
    
    const skip = (page - 1) * limit;
    
    return { page, limit, skip };
  }else{
    return { page: options.page, limit: options.limit, skip: 0 };
  }
};

export default PaginationHelper;
