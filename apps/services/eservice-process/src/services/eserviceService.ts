export const getMockEServices = (offset: number, limit: number) => {
  const eservices = new Array(100).fill(null).map((_, idx) => ({
    id: idx,
  }));

  return {
    items: eservices.slice(offset, offset + limit),
    pagination: {
      total: eservices.length,
      offset,
      limit,
    },
  };
};
