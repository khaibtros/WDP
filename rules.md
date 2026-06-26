# 📐 Backend Coding Rules — Reverie HMS

> **Stack:** Node.js · Express · MongoDB · Mongoose · JWT · Google OAuth  
> **Module System:** CommonJS (`require` / `module.exports`)  
> **Mục tiêu:** Codebase sạch, nhất quán, dễ maintain và dễ onboard thành viên mới.

---

## 📁 1. Project Structure & File Organization

### 1.1 Cấu trúc thư mục chuẩn

```
reverie-hms-be/
├── src/
│   ├── config/
│   │   ├── db.js               # Kết nối MongoDB
│   │   ├── jwt.js              # JWT secret, expiration config
│   │   └── googleAuth.js       # Verify Google OAuth Token
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── serviceCategory.controller.js
│   │   └── service.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   └── serviceCategory.service.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Role.js
│   │   ├── ServiceCategory.js
│   │   └── Service.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── serviceCategory.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   └── utils/
│       ├── jwt.util.js
│       └── error.util.js
├── app.js                      # Khởi tạo Express App + Start Server
├── .env
├── .env.example
├── .gitignore
├── package.json
└── rules.md
```

### 1.2 Quy tắc đặt tên file

| Layer        | Convention                    | Ví dụ                           |
|--------------|-------------------------------|---------------------------------|
| Route        | `<resource>.routes.js`        | `serviceCategory.routes.js`     |
| Controller   | `<resource>.controller.js`    | `serviceCategory.controller.js` |
| Service      | `<resource>.service.js`       | `serviceCategory.service.js`    |
| Model        | `<Resource>.js` (PascalCase)  | `ServiceCategory.js`            |
| Middleware   | `<purpose>.middleware.js`     | `role.middleware.js`            |
| Util         | `<purpose>.util.js`           | `jwt.util.js`                   |
| Config       | `<purpose>.js`                | `db.js`, `googleAuth.js`        |

> ⚠️ **KHÔNG** đặt tên kiểu `helper.js`, `misc.js`, `utils2.js`. Mỗi file phải có mục đích rõ ràng.

---

## 🏗️ 2. Layer Architecture — Trách nhiệm từng lớp

### 2.1 Routes (`src/routes/`)

**Trách nhiệm:** Chỉ định nghĩa route, gắn middleware, gọi controller. **Không chứa bất kỳ business logic nào.**

```js
// ✅ ĐÚNG — serviceCategory.routes.js
const express = require("express");
const router = express.Router();

const serviceCategoryController = require("../controllers/serviceCategory.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

router.get("/", authMiddleware, requireRole("Manager"), serviceCategoryController.getAllCategories);
router.get("/:id", authMiddleware, requireRole("Manager"), serviceCategoryController.getCategoryById);
router.post("/", authMiddleware, requireRole("Manager"), serviceCategoryController.createCategory);
router.put("/:id", authMiddleware, requireRole("Manager"), serviceCategoryController.updateCategory);

module.exports = router;
```

```js
// ❌ SAI — business logic trong route
router.post("/", async (req, res) => {
  const category = await ServiceCategory.findOne({ name: req.body.name }); // ❌
  // ...
});
```

**Rules:**
- Mỗi file route chỉ quản lý 1 resource
- Middleware (`authMiddleware`, `requireRole`) phải được gắn tại đây, **không** gắn trong controller
- Sắp xếp route theo thứ tự: `GET` → `POST` → `PUT/PATCH` → `DELETE`
- Luôn prefix resource: `/api/auth`, `/api/service-categories`

---

### 2.2 Controllers (`src/controllers/`)

**Trách nhiệm:** Nhận request, extract data, gọi service, trả response và xử lý lỗi trực tiếp.

```js
// ✅ ĐÚNG — serviceCategory.controller.js
const serviceCategoryService = require("../services/serviceCategory.service");

const getAllCategories = async (req, res) => {
  try {
    const { keyword } = req.query;
    const categories = await serviceCategoryService.getAllCategories(keyword);

    return res.status(200).json(categories);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    await serviceCategoryService.createCategory(name, description);

    return res.status(201).json({ message: "Category created successfully" });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { getAllCategories, createCategory };
```

```js
// ❌ SAI — DB query trực tiếp trong controller
const createCategory = async (req, res) => {
  const category = await ServiceCategory.create({ name: req.body.name }); // ❌
  res.json(category);
};
```

**Rules:**
- Controller function phải là `async` và luôn có `try/catch`
- Lỗi được xử lý trực tiếp trong `catch`: trả về `res.status(err.statusCode || 500).json(...)`
- Chỉ extract data từ `req.body`, `req.params`, `req.query`, `req.user`
- **Không** import Model trực tiếp vào controller — chỉ import service
- Mỗi function chỉ làm 1 việc (Single Responsibility)

---

### 2.3 Services (`src/services/`)

**Trách nhiệm:** Toàn bộ business logic, DB operations, validation phức tạp.

```js
// ✅ ĐÚNG — serviceCategory.service.js
const ServiceCategory = require("../models/ServiceCategory");
const { createError } = require("../utils/error.util");

const getAllCategories = async (keyword = "") => {
  const filter = keyword
    ? { name: { $regex: keyword, $options: "i" } }
    : {};

  const categories = await ServiceCategory.find(filter)
    .select("_id name description")
    .lean();

  return categories;
};

const createCategory = async (name, description) => {
  if (!name || !name.trim()) {
    throw createError("Name is required", 400);
  }

  const existing = await ServiceCategory.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  });

  if (existing) {
    throw createError("Category name already exists", 409);
  }

  await ServiceCategory.create({ name: name.trim(), description });
};

module.exports = { getAllCategories, createCategory };
```

**Rules:**
- **Tất cả** DB query phải nằm trong service
- Ném lỗi bằng `throw createError(message, statusCode)` — không dùng `res.status()` trong service
- Không import `req`, `res` trong service
- Dùng `.lean()` khi chỉ cần đọc data (tăng performance)
- Dùng `.select()` để chỉ lấy các field cần thiết

---

### 2.4 Models (`src/models/`)

**Trách nhiệm:** Định nghĩa schema Mongoose.

```js
// ✅ ĐÚNG — ServiceCategory.js
const mongoose = require("mongoose");

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // tự động thêm createdAt, updatedAt
  }
);

module.exports = mongoose.model("ServiceCategory", serviceCategorySchema);
```

**Rules:**
- Luôn bật `timestamps: true`
- Dùng `enum` cho các field có giá trị cố định (status, type, ...)
- Thêm `trim: true` cho các String field do user nhập
- Các field nhạy cảm (password) thêm `select: false`
- Tên collection tự động theo Mongoose convention (PascalCase model → lowercase plural collection)
- Không chứa business logic trong model

---

### 2.5 Middlewares (`src/middlewares/`)

**Trách nhiệm:** Cross-cutting concerns — xác thực JWT, kiểm tra role.

```js
// ✅ ĐÚNG — auth.middleware.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
```

```js
// ✅ ĐÚNG — role.middleware.js
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
    }
    next();
  };
};

module.exports = { requireRole };
```

**Rules:**
- `authMiddleware` phải chạy trước `requireRole` — gắn đúng thứ tự trong routes
- `req.user` được set bởi `authMiddleware` và chứa payload từ JWT: `{ userId, role }`
- `requireRole("Manager")` — tên role phải khớp với `roleName` trong collection Roles
- Middleware chỉ làm 1 việc; không ghép nhiều concerns vào 1 middleware
- Luôn gọi `next()` hoặc trả về response — không để request treo

---

### 2.6 Utils (`src/utils/`)

**Trách nhiệm:** Pure utility functions.

```js
// ✅ ĐÚNG — error.util.js
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { createError };
```

```js
// ✅ ĐÚNG — jwt.util.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.roleId.roleName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
```

**Rules:**
- `createError(message, statusCode)` — **lưu ý thứ tự tham số**: message trước, statusCode sau
- Utils phải là pure functions — không có side effects liên quan đến HTTP
- Không import `req`, `res` vào utils

---

### 2.7 Config (`src/config/`)

**Trách nhiệm:** Centralize configuration.

```js
// ✅ ĐÚNG — jwt.js
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};
```

**Rules:**
- **Tất cả** giá trị từ `process.env` phải được đọc trong `config/` — không đọc rải rác ở nơi khác
- Không hardcode secret, URL, port bất kỳ đâu ngoài `.env`

---

## 🔗 3. app.js

`app.js` khởi tạo Express, đăng ký middleware, routes, kết nối DB và start server.

```js
// ✅ ĐÚNG — app.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/users.routes"));
app.use("/api/service-categories", require("./src/routes/serviceCategory.routes"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
```

---

## ✍️ 4. Naming Conventions

### 4.1 Variables & Functions

```js
// ✅ camelCase cho variables và functions
const userToken = generateToken(payload);
const findUserById = async (id) => { ... };

// ✅ SCREAMING_SNAKE_CASE cho constants / config values
const JWT_SECRET = process.env.JWT_SECRET;

// ❌ TRÁNH
const UserToken = ...;    // PascalCase cho non-class
const find_user = ...;    // snake_case
```

### 4.2 Classes & Models

```js
// ✅ PascalCase cho Mongoose model name
mongoose.model("ServiceCategory", serviceCategorySchema);
```

### 4.3 API Endpoints

```
✅ kebab-case, danh từ số nhiều (plural noun), không dùng động từ

GET    /api/service-categories          → Lấy danh sách
GET    /api/service-categories/:id      → Lấy chi tiết
POST   /api/service-categories          → Tạo mới
PUT    /api/service-categories/:id      → Cập nhật

❌ TRÁNH
GET  /api/getServiceCategories
POST /api/create-service-category
GET  /api/ServiceCategory
```

---

## 🔒 5. Error Handling

### 5.1 Pattern chuẩn

```js
// Service — throw lỗi với statusCode
const createCategory = async (name, description) => {
  if (!name) throw createError("Name is required", 400);

  const existing = await ServiceCategory.findOne({ name });
  if (existing) throw createError("Category name already exists", 409);

  await ServiceCategory.create({ name, description });
};

// Controller — catch lỗi và trả response trực tiếp
const createCategory = async (req, res) => {
  try {
    await serviceCategoryService.createCategory(req.body.name, req.body.description);
    return res.status(201).json({ message: "Category created successfully" });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};
```

```js
// ❌ SAI — dùng res.status() trong service
const createCategory = async (name, res) => {
  return res.status(400).json({ message: "..." }); // ❌ service không biết về HTTP
};

// ❌ SAI — bỏ qua lỗi
try {
  ...
} catch (err) {
  console.log(err); // Log nhưng không trả response
}
```

> ⚠️ **Thứ tự tham số `createError`:** `createError(message, statusCode)` — message trước, statusCode sau.

### 5.2 HTTP Status Code chuẩn

| Code | Dùng khi                                      |
|------|-----------------------------------------------|
| 200  | Request thành công (GET, PUT, PATCH, DELETE)  |
| 201  | Tạo resource thành công (POST)                |
| 400  | Bad Request — dữ liệu đầu vào không hợp lệ   |
| 401  | Unauthorized — chưa xác thực / token không hợp lệ |
| 403  | Forbidden — không đủ quyền                   |
| 404  | Not Found — resource không tồn tại           |
| 409  | Conflict — duplicate data                     |
| 500  | Internal Server Error                         |

---

## 📤 6. API Response Format

Response format tùy theo từng endpoint — nhất quán trong cùng 1 controller:

```js
// Success — có data
res.status(200).json({
  success: true,
  data: { ... },
});

// Success — chỉ message
res.status(201).json({ message: "Category created successfully" });

// Success — trả thẳng array (list endpoint)
res.status(200).json([...]);

// Error (trong catch của controller)
res.status(err.statusCode || 500).json({
  success: false,
  message: err.message,
});
```

---

## 🔐 7. Security Rules

### 7.1 Authentication & JWT

```js
// ✅ JWT payload chỉ chứa thông tin tối thiểu
jwt.sign({ userId: user._id, role: user.roleId.roleName }, JWT_SECRET, { expiresIn });

// ❌ Không đưa password/sensitive data vào JWT payload
jwt.sign({ userId: user._id, passwordHash: user.passwordHash }, ...); // ❌
```

### 7.2 Password Handling

```js
// ✅ Luôn hash password, không bao giờ lưu plaintext
const passwordHash = await bcrypt.hash(password, 12);

// ✅ Field passwordHash có select: false trong schema
passwordHash: { type: String, select: false }
```

### 7.3 Environment Variables

```
# ✅ .env (không commit lên git)
MONGO_URI=mongodb+srv://...
JWT_SECRET=<minimum-32-char-random-string>
JWT_EXPIRES_IN=7d
PORT=3000

# ✅ .gitignore phải có
.env
```

---

## 🗄️ 8. MongoDB & Mongoose Best Practices

```js
// ✅ Dùng .lean() khi chỉ đọc data (tăng performance ~2-3x)
const categories = await ServiceCategory.find(filter).lean();

// ✅ Select chỉ các field cần thiết
const category = await ServiceCategory.findById(id)
  .select("_id name description createdAt")
  .lean();

// ✅ Case-insensitive search bằng $regex
const filter = { name: { $regex: keyword, $options: "i" } };

// ✅ Check duplicate không phân biệt hoa thường
const existing = await ServiceCategory.findOne({
  name: { $regex: `^${name.trim()}$`, $options: "i" },
});

// ✅ Luôn await Mongoose queries
const category = await ServiceCategory.findById(id); // ✅
const category = ServiceCategory.findById(id);       // ❌ Query object
```

---

## 📝 9. Code Style & Formatting

- **Indentation:** 2 spaces (không dùng tab)
- **Quotes:** Double quotes `"` cho strings
- **Semicolons:** Bắt buộc ở cuối statement
- **Trailing comma:** Bật

```js
// ✅ Destructure khi cần nhiều field
const { name, description } = req.body;
const { keyword } = req.query;

// ✅ Luôn dùng async/await, không dùng .then().catch() trong controller/service
const createCategory = async (req, res) => { ... };

// ✅ Default parameter trong service
const getAllCategories = async (keyword = "") => { ... };
```

---

## 🚫 10. Common Anti-patterns (TUYỆT ĐỐI TRÁNH)

| Anti-pattern | Vấn đề | Cách đúng |
|---|---|---|
| Business logic trong route | Không tái sử dụng được | Đưa vào service |
| DB query trong controller | Vi phạm separation of concerns | Đưa vào service |
| `res.status()` trong service | Service phụ thuộc HTTP | Dùng `throw createError()` |
| `process.env.X` rải rác | Khó quản lý config | Tập trung trong `config/` |
| Hardcode secret/URL | Security risk | Dùng `.env` |
| Không có `try/catch` trong async | Unhandled promise rejection | Bắt buộc có `try/catch` |
| Trả về password trong response | Security risk | Dùng `select: false` |
| Import Model vào Controller | Bypass service layer | Chỉ import trong service |
| `createError(statusCode, message)` sai thứ tự | Bug khó debug | `createError(message, statusCode)` |
| Gắn middleware trong controller | Vi phạm convention | Gắn middleware ở routes |

---

## ✅ 11. Checklist trước khi merge

- [ ] Không có `process.env.X` nằm ngoài `config/`
- [ ] Không có DB query trong controller
- [ ] Không có `res.status()` trong service
- [ ] Tất cả async function có `try/catch`
- [ ] Lỗi trong controller được xử lý: `res.status(err.statusCode || 500).json(...)`
- [ ] `createError(message, statusCode)` — đúng thứ tự tham số
- [ ] Middleware (`authMiddleware`, `requireRole`) được gắn ở route, không trong controller
- [ ] Không có secret, password, URI nào bị hardcode
- [ ] `.env` không được commit
- [ ] Tên file, function, variable đúng convention
- [ ] Role name trong `requireRole()` khớp với `roleName` trong DB

---

*Được maintain bởi team Reverie HMS. Cập nhật khi có thay đổi kiến trúc.*
