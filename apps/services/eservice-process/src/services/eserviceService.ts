export const getMockEServices = (offset: number, limit: number) => {
  // Mock data: 100 e-services with ids 0 to 99, with pagination support
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
