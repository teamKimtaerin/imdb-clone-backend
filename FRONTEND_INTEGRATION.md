# Frontend Integration Guide

## Backend is Ready! ✅

The backend is fully configured and tested to work with your NavigationBar component. Here's what your frontend AuthContext needs to handle:

## 1. Login Response Structure

When calling `POST /api/auth/login`, you receive:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "68a6423405a62a2ad065e834",
      "username": "navtest",
      "nickname": "NavTest",
      "email": "navtest@example.com",
      "isEmailVerified": true
    }
  }
}
```

## 2. What Your AuthContext Should Do

### After Successful Login:
```javascript
const login = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email,
      password
    });
    
    if (response.data.success) {
      // 1. Store tokens
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      
      // 2. Set user in context state (THIS IS CRITICAL!)
      setUser(response.data.data.user); // <-- This makes NavigationBar show the buttons
      
      // 3. Redirect
      router.push('/');
    }
  } catch (error) {
    // Handle error
  }
};
```

### On App Load (to persist login):
```javascript
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    // Fetch user profile to restore session
    axios.get('http://localhost:4000/api/auth/profile', {
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    })
    .then(response => {
      if (response.data.success) {
        setUser(response.data.data.user); // <-- Restore user in context
      }
    })
    .catch(() => {
      // Token invalid, clear storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    });
  }
}, []);
```

### For API Calls (axios interceptor):
```javascript
// Add token to all requests
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);
```

### Logout Function:
```javascript
const logout = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    // Call logout endpoint
    await axios.post('http://localhost:4000/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear user from context (THIS IS CRITICAL!)
    setUser(null); // <-- This makes NavigationBar show login button
    
    // Redirect to home
    router.push('/');
  } catch (error) {
    // Even if API fails, clear local state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/');
  }
};
```

## 3. CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:3001`

With credentials and Authorization headers allowed.

## 4. Test Credentials

For testing the NavigationBar:
- Email: `navtest@example.com`
- Password: `Test123!@#`

## 5. Checklist for NavigationBar to Work

- [ ] AuthContext stores user object in state after login
- [ ] AuthContext restores user from `/api/auth/profile` on app load
- [ ] AuthContext clears user object on logout
- [ ] All API calls include `Authorization: Bearer <token>` header
- [ ] Frontend URL is `http://localhost:3000` or `http://localhost:3001`

## 6. Common Issues and Solutions

### NavigationBar not showing user buttons after login:
- **Issue**: `user` object is null in AuthContext
- **Solution**: Make sure to call `setUser(response.data.data.user)` after successful login

### Getting 401 Unauthorized on profile endpoint:
- **Issue**: Token not being sent or wrong format
- **Solution**: Use `Authorization: Bearer ${token}` format (note the space after Bearer)

### CORS errors:
- **Issue**: Frontend running on different port
- **Solution**: Make sure frontend is on port 3000 or 3001, or update CORS in backend

## API Endpoints Summary

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user (requires email verification first)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user (requires auth)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/send-verification` - Send email verification
- `POST /api/auth/verify-code` - Verify email code
- `POST /api/auth/change-password` - Change password (requires auth)
- `POST /api/auth/change-email` - Change email (requires auth)
- `DELETE /api/auth/delete-account` - Delete account (requires auth)