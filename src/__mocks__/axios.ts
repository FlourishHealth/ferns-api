const mockAxios = {
  post: jest.fn(() => Promise.resolve({ status: 200 })),
};

export default mockAxios;
