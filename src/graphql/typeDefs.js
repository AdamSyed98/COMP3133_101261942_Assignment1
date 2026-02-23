const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Upload

  type FieldError {
    field: String!
    message: String!
  }

  type User {
    _id: ID!
    username: String!
    email: String!
    created_at: String
    updated_at: String
  }

  type Employee {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
    created_at: String
    updated_at: String
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    token: String
    user: User
    errors: [FieldError!]
  }

  type GenericResponse {
    success: Boolean!
    message: String!
  }

  type EmployeeResponse {
    success: Boolean!
    message: String!
    employee: Employee
    errors: [FieldError!]
  }

  type EmployeesResponse {
    success: Boolean!
    message: String!
    employees: [Employee!]!
  }

  input SignupInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    usernameOrEmail: String!
    password: String!
  }

  input AddEmployeeInput {
    first_name: String!
    last_name: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
  }

  input UpdateEmployeeInput {
    first_name: String
    last_name: String
    email: String
    gender: String
    designation: String
    salary: Float
    date_of_joining: String
    department: String
  }

  type Query {
    login(input: LoginInput!): AuthPayload!
    getAllEmployees: EmployeesResponse!
    searchEmployeeByEid(eid: ID!): EmployeeResponse!
    searchEmployeesByDesignationOrDepartment(designation: String, department: String): EmployeesResponse!
  }

  type Mutation {
    signup(input: SignupInput!): AuthPayload!
    addEmployee(input: AddEmployeeInput!, photo: Upload): EmployeeResponse!
    updateEmployeeByEid(eid: ID!, input: UpdateEmployeeInput!, photo: Upload): EmployeeResponse!
    deleteEmployeeByEid(eid: ID!): GenericResponse!
  }
`;

module.exports = { typeDefs };