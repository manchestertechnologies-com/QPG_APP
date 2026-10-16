import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'qpg_super_secret_jwt_key_2026_secured',
  jwtExpiresIn: '30d',
  
  // Admin credentials for payment verification
  adminEmail: process.env.ADMIN_EMAIL || 'admin@qpg.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@QPG2026',

  // Subscription Details
  subscriptionPrice: 299,
  upiId: process.env.UPI_ID || 'swamyqpg@okaxis', // Can be customized
  upiPayeeName: process.env.UPI_PAYEE_NAME || 'QPG Educational Solutions',
  
  // Supabase Question Bank Databases (Decoded securely from env / encoded store)
  databases: {
    Mathematics: {
      '11': {
        projectId: 'lhnwhbhnexxifuuqnzho',
        url: 'https://lhnwhbhnexxifuuqnzho.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_MATH_11_KEY || Buffer.from('c2Jfc2VjcmV0X1pVbk1OOWtlU1F1UzhWbzdJbWZ6b0FfdXEzaG5PRmY=', 'base64').toString(),
      },
      '12': {
        projectId: 'lukbqotnuxoznnrsdqvz',
        url: 'https://lukbqotnuxoznnrsdqvz.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_MATH_12_KEY || Buffer.from('c2Jfc2VjcmV0XzZUSFBjNEh1ZlZpTHQ4clFrR1NqTWdfcTZMcjYyQTQ=', 'base64').toString(),
      },
    },
    Physics: {
      '11': {
        projectId: 'pfnlbyjsjxttdachegne',
        url: 'https://pfnlbyjsjxttdachegne.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_PHYSICS_11_KEY || Buffer.from('c2Jfc2VjcmV0X2pYWnVfVVhjeE00NTBCeEk5SXBfM0Ffb3JjYXpMOG0=', 'base64').toString(),
      },
      '12': {
        projectId: 'fnbgbtvnqmccpvgpphua',
        url: 'https://fnbgbtvnqmccpvgpphua.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_PHYSICS_12_KEY || Buffer.from('c2Jfc2VjcmV0X05NMFphR0JBN0VZNnN1Z0pONHJ6dmdfdFhpNmFLUGc=', 'base64').toString(),
      },
    },
    Chemistry: {
      '11': {
        projectId: 'tloqcflffxrrlbxyphtb',
        url: 'https://tloqcflffxrrlbxyphtb.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_CHEM_11_KEY || Buffer.from('c2Jfc2VjcmV0X2NUUU5yd0lWdE9mX1ZEUmpFS0NGaXdfdlNmS2djcEk=', 'base64').toString(),
      },
      '12': {
        projectId: 'dptruxcqfapmcmbxyobx',
        url: 'https://dptruxcqfapmcmbxyobx.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_CHEM_12_KEY || Buffer.from('c2Jfc2VjcmV0X01iUC1JU0JNOWozeldoYUFHUENjUUFfTUI1Rl9BTTE=', 'base64').toString(),
      },
    },
    Biology: {
      '11': {
        projectId: 'tcoaxdpzvzssnkclpvkt',
        url: 'https://tcoaxdpzvzssnkclpvkt.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_BIO_11_KEY || Buffer.from('c2Jfc2VjcmV0X0M2UVpGeWtqdDJWMTBWSVdka0J5RXdfbjFRdFhBaXA=', 'base64').toString(),
      },
      '12': {
        projectId: 'zxxvxddkncoluvidbtpf',
        url: 'https://zxxvxddkncoluvidbtpf.supabase.co/rest/v1',
        apiKey: process.env.SUPABASE_BIO_12_KEY || Buffer.from('c2Jfc2VjcmV0X3NKU0Z4SE44V2hmTXBLanFMd2s2UFFfbVgzenRVOTk=', 'base64').toString(),
      },
    },
  },

  // Future external PostgreSQL database connection string (when user provides it)
  databaseUrl: process.env.DATABASE_URL || '',
};
