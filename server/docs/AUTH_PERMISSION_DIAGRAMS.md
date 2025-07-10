# Authentication & Permission System Diagrams

## 1. Authentication Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant AuthRoutes
    participant AuthController
    participant AuthService
    participant UserModel
    participant JWT
    participant Database

    Client->>AuthRoutes: POST /api/auth/login
    AuthRoutes->>AuthController: login(req, res)
    AuthController->>AuthService: authenticateUser(credentials)
    AuthService->>UserModel: findOne({email})
    UserModel->>Database: Query user
    Database-->>UserModel: User data
    UserModel-->>AuthService: User object
    AuthService->>AuthService: bcrypt.compare(password)
    alt Password Valid
        AuthService->>JWT: jwt.sign(payload)
        JWT-->>AuthService: JWT token
        AuthService-->>AuthController: {user, token}
        AuthController-->>AuthRoutes: Success response
        AuthRoutes-->>Client: {token, user}
    else Password Invalid
        AuthService-->>AuthController: Error
        AuthController-->>AuthRoutes: 401 Unauthorized
        AuthRoutes-->>Client: Error response
    end
```

## 2. Middleware Chain Architecture

```mermaid
graph TD
    A[Incoming Request] --> B{Route Type?}
    
    B -->|Public Routes| C[Direct to Controller]
    B -->|Protected Routes| D[authMiddleware]
    B -->|Admin Routes| E[authMiddleware]
    B -->|Owner Routes| F[authMiddleware]
    
    D --> G[JWT Verification]
    E --> H[JWT Verification]
    F --> I[JWT Verification]
    
    G --> J{Token Valid?}
    H --> K{Token Valid?}
    I --> L{Token Valid?}
    
    J -->|No| M[401 Unauthorized]
    K -->|No| N[401 Unauthorized]
    L -->|No| O[401 Unauthorized]
    
    J -->|Yes| P[Add user to req]
    K -->|Yes| Q[Add user to req]
    L -->|Yes| R[Add user to req]
    
    P --> S[Controller]
    Q --> T[adminMiddleware]
    R --> U[ownershipMiddleware]
    
    T --> V{User Role = admin?}
    V -->|No| W[403 Forbidden]
    V -->|Yes| X[Controller]
    
    U --> Y{User owns resource?}
    Y -->|No| Z[403 Forbidden]
    Y -->|Yes| AA[Controller]
    
    C --> BB[Controller Response]
    S --> CC[Controller Response]
    X --> DD[Controller Response]
    AA --> EE[Controller Response]
```

## 3. Permission Matrix

```mermaid
graph LR
    subgraph "Route Categories"
        A[Public Routes]
        B[Protected Routes]
        C[Admin Routes]
        D[Owner Routes]
    end
    
    subgraph "User Roles"
        E[Anonymous]
        F[Customer]
        G[Admin]
    end
    
    subgraph "Resources"
        H[Products - Read]
        I[Products - Write]
        J[Orders - Read Own]
        K[Orders - Read All]
        L[Users - Manage]
        M[Statistics]
        N[Categories - Write]
        O[Reviews - Write Own]
    end
    
    E --> A
    E --> H
    
    F --> A
    F --> B
    F --> H
    F --> J
    F --> O
    
    G --> A
    G --> B
    G --> C
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    G --> M
    G --> N
```

## 4. Detailed Route Permissions

### Authentication Routes (`/api/auth`)
- **POST /login** - Public ✅
- **POST /register** - Public ✅
- **POST /logout** - Protected (any authenticated user) 🔐
- **GET /me** - Protected (any authenticated user) 🔐

### Product Routes (`/api/products`)
- **GET /** - Public ✅
- **GET /:id** - Public ✅
- **POST /** - Admin only 👑
- **PUT /:id** - Admin only 👑
- **DELETE /:id** - Admin only 👑

### Order Routes (`/api/orders`)
- **GET /** - Admin (all orders) 👑 / User (own orders) 🔐👤
- **GET /:id** - Admin 👑 / Owner 👤
- **POST /** - Protected 🔐
- **PUT /:id** - Admin 👑 / Owner 👤
- **DELETE /:id** - Admin only 👑

### User Routes (`/api/users`)
- **GET /** - Admin only 👑
- **GET /:id** - Admin 👑 / Owner 👤
- **PUT /:id** - Admin 👑 / Owner 👤
- **DELETE /:id** - Admin only 👑

### Category Routes (`/api/categories`)
- **GET /** - Public ✅
- **GET /:id** - Public ✅
- **POST /** - Admin only 👑
- **PUT /:id** - Admin only 👑
- **DELETE /:id** - Admin only 👑

### Statistics Routes (`/api/statistics`)
- **GET /dashboard** - Admin only 👑
- **GET /revenue** - Admin only 👑
- **GET /orders** - Admin only 👑
- **GET /products** - Admin only 👑

## 5. Security Implementation Details

### JWT Token Structure
```json
{
  "payload": {
    "userId": "ObjectId",
    "email": "user@example.com",
    "role": "customer|admin",
    "iat": 1234567890,
    "exp": 1234567890
  }
}
```

### Password Security
- **Hashing**: bcrypt with salt rounds
- **Verification**: bcrypt.compare()
- **Storage**: Never store plain passwords

### Error Handling
- **401 Unauthorized**: Invalid/missing token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not exists
- **AppError**: Centralized error handling

## 6. Middleware Execution Order

```
Request → Route Handler → Middleware Chain → Controller
                    ↓
1. authMiddleware (if protected)
2. adminMiddleware (if admin required)
3. ownershipMiddleware (if ownership required)
4. validateObjectId (if ID validation needed)
5. Controller function
```

## Legend
- ✅ Public access
- 🔐 Requires authentication
- 👑 Requires admin role
- 👤 Requires resource ownership
- 🔐👤 Requires auth + ownership check
