module.exports = ({ env }) => ({
  host: env('SERVER_HOST'),
  port: env.int('SERVER_PORT'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
});
