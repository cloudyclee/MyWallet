module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
        ? '/MyWallet_client/'
        : '/'
}