# How to Make a User an Admin

## Quick Method: Direct Database Update

1. Open a terminal in the backend folder:
```powershell
cd "c:\Program Files\Project\korean_translation_project\backend"
python
```

2. Run this Python code (replace "your_username" with actual username):
```python
from database import SessionLocal
from models.user import User

db = SessionLocal()
user = db.query(User).filter(User.username == "your_username").first()

if user:
    user.role = "admin"
    db.commit()
    print(f"✅ {user.username} is now an admin!")
else:
    print("❌ User not found")

db.close()
exit()
```

## Alternative Methods

### Method 2: Via AdminPanel UI
*(Only works if you already have an admin account)*
1. Login as admin
2. Navigate to `/admin` page
3. Click "Edit" button on the user you want to promote
4. Change role dropdown to "admin"
5. Click "Save Changes"

### Method 3: Create New Admin User via Signup
1. Sign up normally at `/signup`
2. Then use Method 1 (database update) to change role to "admin"

### Method 4: Via API (if you have admin access)
```bash
POST /api/admin/users
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "email": "newadmin@example.com",
  "username": "newadmin",
  "password": "securepassword123",
  "role": "admin"
}
```

## User Roles

- **admin**: Full access to everything including user management, all projects, analytics
- **manager**: Can manage projects and team members (coming soon)
- **team_member**: Basic access to translations and assigned projects

## Testing Admin Access

After making someone admin, they can:
1. Access the Admin Panel at `/admin`
2. View and edit all users
3. Create new users with any role
4. Delete users (except themselves)
5. View system-wide analytics
