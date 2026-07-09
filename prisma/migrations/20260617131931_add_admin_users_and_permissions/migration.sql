-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUserPermission" (
    "id" SERIAL NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "AdminUser_username_idx" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "AdminUser_isActive_idx" ON "AdminUser"("isActive");

-- CreateIndex
CREATE INDEX "AdminUser_isSuperAdmin_idx" ON "AdminUser"("isSuperAdmin");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_code_key" ON "AdminPermission"("code");

-- CreateIndex
CREATE INDEX "AdminPermission_code_idx" ON "AdminPermission"("code");

-- CreateIndex
CREATE INDEX "AdminUserPermission_adminUserId_idx" ON "AdminUserPermission"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminUserPermission_permissionId_idx" ON "AdminUserPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUserPermission_adminUserId_permissionId_key" ON "AdminUserPermission"("adminUserId", "permissionId");

-- AddForeignKey
ALTER TABLE "AdminUserPermission" ADD CONSTRAINT "AdminUserPermission_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserPermission" ADD CONSTRAINT "AdminUserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "AdminPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
