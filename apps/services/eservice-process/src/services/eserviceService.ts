export const getMockEservices = (offset: number, limit: number) => {
  // Mock data: 100 e-services with ids 0 to 99, with pagination support
  const eservices = new Array(100).fill(null).map((_, idx) => ({
    id: idx,
  }));

  return {
    items: eservices.slice(offset, offset + limit),
    pagination: {
      limit,
      offset,
      total: eservices.length,
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createMockEservice = (_name: string) => ({
  id: Math.floor(Math.random() * 1000000),
});
