export const activeUserWhere = (extras: object = {}) => ({
  ...extras,
  status: true,
  isDeleted: false,
});
