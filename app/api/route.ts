export async function GET() {
  return Response.json({
    ok: true,
    service: 'Nova Bank API',
    baseUrl: 'http://localhost:3000',
    auth: [
      {
        name: 'Login',
        method: 'POST',
        path: '/api/auth/login',
        fields: ['username', 'password']
      },
      {
        name: 'Logout',
        method: 'POST',
        path: '/api/auth/logout'
      },
      {
        name: 'Firebase Google login',
        method: 'POST',
        path: '/api/auth/firebase',
        fields: ['idToken']
      },
      {
        name: 'Current user',
        method: 'GET',
        path: '/api/auth/me'
      },
      {
        name: 'Signup',
        method: 'POST',
        path: '/api/auth/signup',
        fields: [
          'accountNumber',
          'accountName',
          'branch',
          'nic',
          'email',
          'password',
          'confirmPassword'
        ]
      }
    ],
    banking: [
      {
        name: 'Accounts',
        method: 'GET/POST/PUT/DELETE',
        path: '/api/accounts'
      },
      { name: 'Transfer', method: 'POST', path: '/api/transfer' },
      {
        name: 'Beneficiaries',
        method: 'GET/POST/DELETE',
        path: '/api/beneficiaries'
      },
      { name: 'Bill payments', method: 'POST', path: '/api/bill-payments' },
      { name: 'Transactions', method: 'GET', path: '/api/transactions' },
      { name: 'Statement', method: 'GET', path: '/api/statement' },
      { name: 'Smart spend', method: 'GET/POST', path: '/api/smart-spend' },
      {
        name: 'Savings goals',
        method: 'GET/POST/PUT/DELETE',
        path: '/api/savings-goals'
      },
      { name: 'Groq chatbot', method: 'POST', path: '/api/chatbot' },
      { name: 'Profile', method: 'GET/PUT', path: '/api/profile' },
      { name: 'Notifications', method: 'GET', path: '/api/notifications' }
    ],
    system: [
      { name: 'Health', method: 'GET', path: '/api/health' },
      { name: 'Setup', method: 'GET', path: '/api/setup' },
      { name: 'Admin system', method: 'GET', path: '/api/admin/system' },
      { name: 'Search', method: 'GET', path: '/api/search?q=dilara' }
    ]
  })
}
