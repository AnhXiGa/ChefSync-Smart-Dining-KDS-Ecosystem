# ChefSync-Smart-Dining-KDS-Ecosystem

## Admin accounts and roles

The backend applies pending database migrations before seeding built-in roles when it starts.
To apply migrations manually instead, run the command from the `backend` directory:

```powershell
dotnet ef database update
```

From the repository root, use:

```powershell
dotnet ef database update --project .\backend\backend.csproj
```

The backend seeds only the built-in Admin, Manager, Waiter, Chef, and Inventory roles. Open **Manager → Người dùng & quyền** to view database accounts, assign one role, and create accounts with an automatically generated employee code.

Open **Manager → Phiếu nhập hàng** to create and receive supplier orders; selecting **Nhận hàng** adds each line to ingredient stock and records inventory transactions exactly once. **Manager → Nhập kho** is a separate history view showing only receipts that have already been received.