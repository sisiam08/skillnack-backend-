import { PaginationOptions } from "../interfaces";

// Hard cap so a client cannot request an unbounded page size.
export const MAX_PAGE_LIMIT = 100;
const FALLBACK_LIMIT = 10;

const PaginationHelper = (options: PaginationOptions) => {
  if (options.limit) {
    const rawPage = Number(options.page);
    const rawLimit = Number(options.limit);

    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), MAX_PAGE_LIMIT)
        : FALLBACK_LIMIT;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  // Preserve the existing "not paginated" contract when no limit was supplied.
  return { page: options.page, limit: options.limit, skip: 0 };
};

export default PaginationHelper;
