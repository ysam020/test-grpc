// Auto-generated mock file for @atc/grpc-server
class MockBaseGrpcServer {
  constructor() {
    this.server = null;
  }
  
  addService = jest.fn();
  addMiddleware = jest.fn();
  start = jest.fn();
  stop = jest.fn();
  bind = jest.fn();
}

module.exports = {
  BaseGrpcServer: MockBaseGrpcServer,
  CustomServerUnaryCall: {},
  CustomServerUnaryCall : {},
  GrpcError : jest.fn(),
  createGrpcServer: jest.fn(),
  startServer: jest.fn(),
  stopServer: jest.fn(),
};
