/* eslint import/no-default-export: off */
const mockAxios = {
  post: jest.fn(() => Promise.resolve({status: 200})),
};

export default mockAxios;
