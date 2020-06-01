openssl ecparam -genkey -out localhost.key -name secp384r1
openssl req -x509 -new -config req.txt -key localhost.key -out localhost.cert
