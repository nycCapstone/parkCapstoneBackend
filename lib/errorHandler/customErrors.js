class UserAlreadyExistsError extends Error {
  constructor(message) {
    super();
    this.name = "UserAlreadyExistsError";
    this.status = 409;
    this.error = "pg error";
    this.message = message;
  }
}

class EmailHostError extends Error {
  constructor(message) {
    super();
    this.name = "EmailHostError";
    this.status = 403;
    this.error = "SMTP error";
    this.message = message;
  }
}

class PasswordError extends Error {
  constructor(message, error) {
    super();
    this.name = "credential error";
    this.status = 401;
    this.error = error;
    this.message = message;
  }
}

class TokenError extends Error {
  constructor(message, error) {
    super();
    this.name = "refresh token error";
    this.status = 401;
    this.error = error;
    this.message = message;
  }
}

class LoginTokenError extends Error {
  constructor() {
    super();
    this.name = "multiple login error";
    this.status = 405;
    this.error = "001";
    this.message = "logout session in other tabs";
  }
}

class RefreshError extends Error {
  constructor(message) {
    super();
    this.status = 403;
    this.message = message;
  }
}

class AuthError extends Error {
  constructor(message) {
    super();
    this.name = "auth error";
    this.status = 403;
    this.error = `check id for unauthenticated user`;
    this.message = message;
  }
}

class SQLError extends Error {
  constructor(error, option) {
    super();
    this.name = "sql error";
    this.status = option || 500;
    this.error = error;
    this.message = "sql server error";
  }
}

class SQLSpaceTableError extends Error {
  constructor(error) {
    super();
    this.name = "sql error";
    this.status = 500;
    this.error = error;
    this.message = "query error on spaces and properties table";
  }
}

class SQLNothingFound extends Error {
  constructor(error) {
    super();
    this.name = "sql error";
    this.status = 500;
    this.error = error;
    this.message =
      "address and zipcode not found in properties and spaces table";
  }
}

class MultiStatusError extends Error {
  constructor(error, clientUser) {
    super();
    this.name = "sql error";
    this.status = 207;
    this.error = error;
    this.clientUser = clientUser;
    this.message = "Multi-status error on making renter entity";
  }
}

module.exports = {
  EmailHostError,
  UserAlreadyExistsError,
  PasswordError,
  TokenError,
  LoginTokenError,
  RefreshError,
  SQLError,
  SQLSpaceTableError,
  SQLNothingFound,
  AuthError,
  MultiStatusError,
};

