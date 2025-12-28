/**
 * ============================================
 * AHteam - Newagant SaaS Platform
 * API Entry Point
 * ============================================
 * 
 * This is the main entry point for the API server.
 * Currently a placeholder - NestJS will be added later.
 * ============================================
 */

import { Tenant, TenantStatus, User, UserStatus, Email, TenantId, Product, Order } from '@ahteam/core-domain';
import { TenantContext } from '@ahteam/tenant';
import { AuthContext, PasswordService } from '@ahteam/auth';

async function main(): Promise<void> {
    console.log('🚀 AHteam - Newagant SaaS Platform');
    console.log('===================================');
    console.log('');
    console.log('📦 Core Domain Entities:');
    console.log('   ✅ Tenant');
    console.log('   ✅ User');
    console.log('   ✅ Role');
    console.log('   ✅ Store');
    console.log('   ✅ Product');
    console.log('   ✅ Order');
    console.log('');
    console.log('🔧 Packages:');
    console.log('   ✅ @ahteam/core-domain');
    console.log('   ✅ @ahteam/tenant');
    console.log('   ✅ @ahteam/auth');
    console.log('   ✅ @ahteam/shared');
    console.log('');

    // Demo: Create a tenant
    console.log('📋 Demo: Creating entities...');
    console.log('');

    const tenant = Tenant.create({
        name: 'Demo Store',
        slug: 'demo-store',
    });
    console.log(`   Created Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`   Status: ${tenant.status}`);
    console.log(`   ID: ${tenant.id}`);
    console.log('');

    // Demo: Password hashing
    const password = 'SecureP@ss123';
    const hash = await PasswordService.hash(password);
    console.log(`   Password Hash: ${hash.substring(0, 20)}...`);

    const isValid = await PasswordService.verify(password, hash);
    console.log(`   Password Valid: ${isValid}`);
    console.log('');

    console.log('===================================');
    console.log('✅ Platform ready for development!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Add NestJS framework');
    console.log('   2. Configure Prisma ORM');
    console.log('   3. Set up PostgreSQL');
    console.log('   4. Implement API endpoints');
    console.log('');
}

main().catch(console.error);
