export interface PagedResult<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}