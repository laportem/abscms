'use strict';
const fetch = require("node-fetch");

const _sugarURL = process.env.CRM_API_ENDPOINT;

async function getSugarToken() {
    console.log('=======getSugarToken======')
    let _token = null;
    try {
        const _payload = {
            username: process.env.CRM_API_USERNAME,
            password: process.env.CRM_API_PASSWORD,
            grant_type: 'password',
            client_id: 'sugar',
            client_secret: '',
            platform:'base',
        };
        const _request = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(_payload),
        };
        const _response = await fetch(`${_sugarURL}/oauth2/token`, _request);
        const _data = await _response.json();
        if (_data && _data.access_token) {
            _token = _data.access_token;
        }
    } catch(err) {
        console.log(err);
    }
    return _token;
}

async function getRecordIdByEmail(accessToken, email, module) {
    console.log('=======getRecordIdByEmail======' + module);
    let _id = null;
    try {       
        const _filter = {
            "filter": [{ "email_addresses.email_address": email }],
            "fields": ["id", "name"]
        };
        const _request = {
            method: 'POST',
            headers: {
                'OAuth-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(_filter),
        };

        const _response = module === 'contacts'
            ? await fetch(`${_sugarURL}/Contacts/filter`, _request)
            : await fetch(`${_sugarURL}/Accounts/filter`, _request);
        
        const _data = await _response.json();
        if (_data && _data.records && _data.records.length > 0) {
            _id = _data.records[0].id;
        }
    } catch(err) {
        console.log(err);
    }
    return _id;
}

async function createContact(accessToken, form) {
    console.log('=======createContact======')
    let _id = null;
    let _payload = {
        salutation: null,
        first_name: null,
        last_name: null,
        email1: null,
        phone_work: null,
        phone_home: null,
        phone_mobile: null,
        phone_fax: null,
        phone_other: null,
        primary_address_street: null,
        primary_address_city: null,
        primary_address_state: null,
        primary_address_postalcode: null,
        primary_address_country: null,
        alt_address_street: null,
        alt_address_city: null,
        alt_address_state: null,
        alt_address_postalcode: null,
        alt_address_country: null,
        facebook: null,
        twitter: null,
        linkedin_c: null
    }
    try { 
        const _name = form.section4.naturalname;
        if (_name) {
            _payload.salutation = _name.salutation ? _name.salutation.code : null;
            _payload.first_name  = _name.firstname ? _name.firstname : 'unknown';
            _payload.salutation = _name.lastname ? _name.lastname : 'unknown';
        }

        _payload.email1 = form.section4.email && form.section4.email.address ? form.section4.email.address : null;

        const _phones = form.section4.phones;
        if (_phones && _phones.length > 0) {
            _phones.forEach(function (item) {
                if (item.type.code === 'Work' ) { _payload.phone_work = item.number; }
                if (item.type.code === 'Home') { _payload.phone_home = item.number; }
                if (item.type.code === 'Mobile') { _payload.phone_mobile = item.number; }
                if (item.type.code === 'Fax') { _payload.phone_fax = item.number; }
                if (item.type.code === 'Other') { _payload.phone_other = item.number; }
            });
        }

        const _addresses = form.section4.addresses;
        if (_addresses && _addresses.length > 0) {
            _payload.primary_address_street = _addresses[0].street;
            _payload.primary_address_city = _addresses[0].city;
            _payload.primary_address_state = _addresses[0].state;
            _payload.primary_address_postalcode = _addresses[0].postcode;
            _payload.primary_address_country = _addresses[0].country;

            if (_addresses.length > 1) {
                _payload.alt_address_street = _addresses[1].street;
                _payload.alt_address_city = _addresses[1].city;
                _payload.alt_address_state = _addresses[1].state;
                _payload.alt_address_postalcode = _addresses[1].postcode;
                _payload.alt_address_country = _addresses[1].country;
            }
        }

        const _social = form.section4.socialmedias;
        if (_social && _social.length > 0) {
            _social.forEach(function (item) {
                if (item.platform.code === 'Facebook' ) { _payload.facebook = item.name; }
                if (item.platform.code === 'Twitter') { _payload.twitter = item.name; }
                if (item.platform.code === 'LinkedIn') { _payload.linkedin_c = item.name; }
            });
        }

        const _request = {
            method: 'POST',
            headers: {
                'OAuth-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(_payload),
        };
        const _response = await fetch(`${_sugarURL}/Contacts`, _request);
        const _data = await _response.json();
        if (_data && _data.id) {
            _id = _data.id;
        }
    } catch(err) {
        console.log(err);
    }
    return _id;
}

async function createContactIndentity(accessToken, form, contactId) {
    console.log('=======createContactIndentity======')

    let _payloadList = [];
    try { 
        const _identifications = form.section4.identifications;
        if (_identifications && _identifications.length > 0) {
            _identifications.forEach(function (item) {
                let _payload = {
                    name: null,
                    identification_type_c: null,
                    issuing_country_c: null,
                    valid_from_c: null,
                    valid_to_c: null,
                    uuid_c: null,
                    abs1_identifications_contactscontacts_ida: null,
                }
                _payload.name = item && item.number ? item.number : 'unknown';
                _payload.identification_type_c = item && item.type && item.type.code ? item.type.code : null;
                _payload.issuing_country_c = item && item.country ? item.country : null;
                _payload.uuid = item && item.uuid ? item.uuid : null;
                _payload.abs1_identifications_contactscontacts_ida = contactId; // TODO: test if it works
                _payloadList.push(_payload);
            });
        }
        console.log('==========_payloadList final===================')
        console.log(_payloadList);
        if (_payloadList && _payloadList.length > 0) {
            _payloadList.forEach(async function (item) {
                console.log('==========item=================')
                console.log(item);
                const _request = {
                    method: 'POST',
                    headers: {
                        'OAuth-Token': accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({item}),
                };
                const _response = await fetch(`${_sugarURL}/ABS1_identifications`, _request);
                //const _data = await _response.json();
                // console.log(_data)
            });
        };
        /*
        const _request = {
            method: 'POST',
            headers: {
                'OAuth-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({_payloadList}),
        };
        const _response = await fetch(`${_sugarURL}/ABS1_identifications`, _request);
        const _data = await _response.json(); */
        // console.log(_data)
    } catch(err) {
        console.log(err);
    }
}

async function createAccount(accessToken, form) {
    console.log('=======createAccount======')
    let _id = null;
    let _payload = {
        name: null,
        short_name_c: null,
        email1: null,
        phone_office: null,
        phone_home_c: null,
        phone_mobile_c: null,
        phone_fax: null,
        phone_alternate: null,
        billing_address_street: null,
        billing_address_city: null,
        billing_address_state: null,
        billing_address_postalcode: null,
        billing_address_country: null,
        shipping_address_street: null,
        shipping_address_city: null,
        shipping_address_state: null,
        shipping_address_postalcode: null,
        shipping_address_country: null,
        website: null,
        facebook: null,
        twitter: null,
        linkedin_c: null,
        registration_number_c: null,
        registration_country_c: null,
    }
    try {
        const _name = form.section6.legalname;
        if (_name) {
            _payload.name = _name.name ? _name.name  : 'unknown';
            _payload.short_name_c  = _name.short ? _name.short : null;
        }

        _payload.email1 = form.section6.email && form.section6.email.address ? form.section6.email.address : null;

        const _phones = form.section6.phones;
        if (_phones && _phones.length > 0) {
            _phones.forEach(function (item) {
                if (item.type.code === 'Work' ) { _payload.phone_office = item.number; }
                if (item.type.code === 'Home') { _payload.phone_home_c = item.number; }
                if (item.type.code === 'Mobile') { _payload.phone_mobile_c = item.number; }
                if (item.type.code === 'Fax') { _payload.phone_fax = item.number; }
                if (item.type.code === 'Other') { _payload.phone_alternate = item.number; }
            });
        }

        const _addresses = form.section6.addresses;
        if (_addresses && _addresses.length > 0) {
            _payload.billing_address_street = _addresses[0].street;
            _payload.billing_address_city = _addresses[0].city;
            _payload.billing_address_state = _addresses[0].state;
            _payload.billing_address_postalcode = _addresses[0].postcode;
            _payload.billing_address_country = _addresses[0].country;

            if (_addresses.length > 1) {
                _payload.shipping_address_street = _addresses[1].street;
                _payload.shipping_address_city = _addresses[1].city;
                _payload.shipping_address_state = _addresses[1].state;
                _payload.shipping_address_postalcode = _addresses[1].postcode;
                _payload.shipping_address_country = _addresses[1].country;
            }
        }

        const _social = form.section6.socialmedias;
        if (_social && _social.length > 0) {
            _social.forEach(function (item) {
                if (item.platform.code === 'Facebook' ) { _payload.facebook = item.name; }
                if (item.platform.code === 'Twitter') { _payload.twitter = item.name; }
                if (item.platform.code === 'LinkedIn') { _payload.linkedin_c = item.name; }
            });
        }

        const _registration = form.section7;
        if (_registration) {
            _payload.registration_number_c = _registration.regnumber ? _registration.regnumber : null;
            _payload.registration_country_c = _registration.regcountry ? _registration.regcountry : null;
        }

        const _request = {
            method: 'POST',
            headers: {
                'OAuth-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(_payload),
        };
        const _response = await fetch(`${_sugarURL}/Accounts`, _request);
        const _data = await _response.json();
        if (_data && _data.id) {
            _id = _data.id;
        }
    } catch(err) {
        console.log(err);
    }
    return _id;
}

async function linkContactToAccount(accessToken, contactId, accountId) {
    console.log('=======linkContactToAccount======')
    try {
        const _payload = {
            accounts: {
                add: [accountId]
            }
        };
        
        const _request = {
            method: 'PUT',
            headers: {
                'OAuth-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(_payload),
        };
        await fetch(`${_sugarURL}/Contacts/${contactId}`, _request);
    } catch(err) {
        console.log(err);
    }
}


async function sendToCRM(form) {
    let _newContact = false;
    let _contactId = null;
    let _accountId = null;
    const _contactEmail = form.section4 && form.section4.email && form.section4.email.address ? form.section4.email.address : null;
    const _accountEmail = form.section6 && form.section6.email && form.section6.email.address ? form.section6.email.address : null;
    const _accessToken = await getSugarToken();
    if (_contactEmail) {
        _contactId = await getRecordIdByEmail(_accessToken, _contactEmail, 'contacts');
        if (!_contactId) {
            _newContact = true;
            _contactId = await createContact(_accessToken, form);
            /// await createContactIndentity(_accessToken, form, _contactId); //TODO: add
        }
    }
    if (_accountEmail) {
        _accountId = await getRecordIdByEmail(_accessToken, _accountEmail, 'accounts');
        if (!_accountId) {
            _accountId = await createAccount(_accessToken, form);
        }
    }
    if (_newContact) {
        await linkContactToAccount(_accessToken, _contactId, _accountId)
    }
}


module.exports = {
    lifecycles: {
        afterUpdate: async (entry) => {
            console.log('---------------afterUpdate---------------');
            const _form = entry.form ? entry.form : null;
            console.log(entry.status); //TODO: add && _form.status != draft
            if (_form) { //TODO: add && _form.status != draft
                await sendToCRM(_form);
            }
        },
    }
};
