import bcrypt from 'bcryptjs';
console.log(await bcrypt.hash('Admin@123', 10));
