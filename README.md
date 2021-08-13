# DNASpaces PartnerApp Activation

    This sample application shows partners how to integrate with Cisco DNA Spaces for cloud application activation. 
    Cisco DNA Spaces uses OAuth 2.0 to facilitate integration with the Partner dashboard, for Cloud App Activation 
    and for launching activated application using signed JSON Web Token (JWT) authentication for seamless login experience.


## Installation

	Install Node.js and execute "npm install" command under the project root folder.


## Configuration

Properties to be updated under the conf folder

1.customer-clientId.json

    clientSecret - Update the client secret which is configured in "App Tile Configuration" section in partner dashboard.
    redirectUri - Update the Redirect URI which is configured in "App Tile Configuration" section in partner dashboard.
    partnerName - Update the partner tenant name

2.customer.json

    Update the partner details in this file like partner name, tenantId, email, phone and telemetry.

3.user.json
    
    Default user credentails template will be available for OAuth authentication. Once a new user signs up, that user's credentails will be added into this file for further authentication in the partner site.

4.oauth-properties.json

    Update "dna-spaces-firehose-app" application node server port.
    Update the "host" name either "partners.dnaspaces.io" or "partners.dnaspaces.eu" based on the partner dashboard setup.
    Update the respective private and public key path in the configuration. Create private and public pem files steps given below
    Update the encodeKey as which password given in the keytool command. 


## Steps to create private and public pem files 

1) keytool -genkey -keystore keystore.jks -storetype jks -storepass Test123# -keyalg RSA -keysize 512 -alias RS256 -keypass Test123# -sigalg SHA256withRSA -dname "CN=DNASpaces,OU=Engineering,O=Cisco,L=Bangalore,ST=Karnataka,C=IN" -validity 90000
2) keytool -importkeystore -srckeystore keystore.jks -destkeystore keyapp.p12 -srcalias RS256 -srcstoretype jks -deststoretype pkcs12
3) openssl pkcs12 -in keyapp.p12 -out private.pem
4) openssl rsa -pubout -in ./private.pem -out ./public.pem


## Application startup command

	npm run start
