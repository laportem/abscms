'use strict';
const fetch = require("node-fetch");
const fs = require('fs');

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
    try { 
        const _identifications = form.section4.identifications;
        if (_identifications && _identifications.length > 0) {
            _identifications.forEach(async function (item) {
                let _payload = {
                    name: null,
                    identification_type_c: null,
                    issuing_country_c: null,
                    valid_from_c: null,
                    valid_to_c: null,
                    uuid_c: null,
                }
                _payload.name = item && item.number ? item.number : 'unknown';
                _payload.identification_type_c = item && item.type && item.type.code ? item.type.code : null;
                _payload.issuing_country_c = item && item.country ? item.country : null;
                if (item && item.valid_until) {
                    var _parts = item.valid_until.split('/');
                    // _parts[2] = YYYY, _parts[1] = MM, _parts[0] = DD - notice the month (_parts[1]); JS counts months from 0:
                    _payload.valid_to_c = new Date(_parts[2], _parts[1] - 1, _parts[0]);
                }
                _payload.uuid_c = item && item.uuid ? item.uuid : null;
                const _request = {
                    method: 'POST',
                    headers: {
                        'OAuth-Token': accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(_payload)
                };
                await fetch(`${_sugarURL}/Contacts/${contactId}/link/abs1_identifications_contacts`, _request);
            });
        }
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

async function createApplication(accessToken, form, contactId, accountId, refnum) {
    console.log('=======createApplication======')
    let _id = null;
    let _payload = {
        name: refnum,
        uuid_c: null,
        purpose_c: null,
        applicant_type_c: null,
        account_id: accountId,
        contact_id_c: contactId,
        contact_role: 'Natural Person',
        sales_stage: 'New Submission',
        priority_c: 'Medium',
        started_date_c: null,
        submitted_date_c: null,
        expected_completion_date_c: null,
        np_capacity_c: null,
        indigenous_involvement_c: null,
        knowledge_use_c: null,
        agree_colla_prty_c: null,
        agree_resource_prvd_c: null,
        agree_resource_owner_c: null,
        assist_authority_c: null,
        assist_requested_c: null,
        form_declaration_c: null,
    }
    try {
        const _summary = form.summary;
        if (_summary && _summary.uuid) {
             _payload.uuid_c = _summary.uuid;
        }

        const _purpose = form.section2.purpose;
        if (_purpose) {
            switch(_purpose.code) {
                case "commercial": {
                    _payload.purpose_c = 'Commercial Use';
                    break;
                }
                case "non-commercial": {
                    _payload.purpose_c = 'Non Commercial Use';
                    break;
                }
                default: {
                    _payload.purpose_c = null;
                    break;
                }
            }
        }

        const _type = form.section3.personType;
        if (_type) {
            switch(_type.code) {
                case "naturalperson": {
                    _payload.applicant_type_c = 'Natural Person';
                    break;
                }
                case "legalperson": {
                    _payload.applicant_type_c = 'Legal Person';
                    break;
                }
                default: {
                    _payload.applicant_type_c = null;
                    break;
                }
            }
        }

        const _date_started = form.summary.startdate;
        if (_date_started) {
            _payload.started_date_c = _date_started;
        }

        const _submitdate = form.summary.submitdate;
        if (_submitdate) {
            var _sdt = new Date(_submitdate);
            var _ecdt = new Date();
            _ecdt.setMonth(_sdt.getMonth() + 1);
            _payload.submitted_date_c = _sdt;
            _payload.expected_completion_date_c = _ecdt;
        }

        const _contactcapacity = form.section8.contactcapacity;
        if (_contactcapacity) {
            _payload.np_capacity_c = _contactcapacity;
        }

        const _community = form.section17.community;
        if (_community) {
            _payload.indigenous_involvement_c = _community;
        }

        const _knowledge = form.section17.knowledge;
        if (_knowledge) {
            _payload.knowledge_use_c = _knowledge;
        }

        const _dis_collaborate = form.section18.agreementSigned;
        if (_dis_collaborate && _dis_collaborate.id) {
            _payload.agree_colla_prty_c = _dis_collaborate.id === 1 ? 'Yes' : 'No';
        }

        const _dis_provider = form.section18.disclosedToProviders;
        if (_dis_provider && _dis_provider.id) {
            _payload.agree_resource_prvd_c = _dis_provider.id === 1 ? 'Yes' : 'No';
        }

        const _dis_holder = form.section18.disclosedToHolders;
        if (_dis_holder && _dis_holder.id) {
            _payload.agree_resource_owner_c = _dis_holder.id === 1 ? 'Yes' : 'No';
        }

        const _assist_authority = form.section18.assistanceNeeded;
        if (_assist_authority && _assist_authority.id) {
            _payload.assist_authority_c = _assist_authority.id === 1 ? 'Yes' : 'No';
        }

        
        const _assist_note = form.section18.assistanceNote;
        if (_assist_note) {
            _payload.assist_requested_c = _assist_note.trim();;
        }

        const _dis_agreed = form.section20.agreed;
        _payload.form_declaration_c = _dis_agreed ? true : false;

        const _request = {
            method: 'POST',
            headers: {
                'OAuth-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(_payload),
        };
        const _response = await fetch(`${_sugarURL}/Contacts/${contactId}/link/opportunities`, _request);
        const _data = await _response.json();
        if (_data && _data.related_record && _data.related_record.id) {
            _id = _data.related_record.id;
        }
    } catch(err) {
        console.log(err);
    }
    return _id;
}

async function sendToCRM(entry) {
    console.log('=======sendToCRM======')
    const _form = entry.form;
    let _accessToken = null;
    let _newContact = false;
    let _contactId = null;
    let _accountId = null;
    const _contactEmail = _form.section4 && _form.section4.email && _form.section4.email.address ? _form.section4.email.address : null;
    const _accountEmail = _form.section6 && _form.section6.email && _form.section6.email.address ? _form.section6.email.address : null;
    _accessToken = await getSugarToken();
    if (_contactEmail) {
        _contactId = await getRecordIdByEmail(_accessToken, _contactEmail, 'contacts');
        console.log()
        if (!_contactId) {
            _newContact = true;
            _contactId = await createContact(_accessToken, _form);
        }
    }
    if (_accountEmail) {
        _accountId = await getRecordIdByEmail(_accessToken, _accountEmail, 'accounts');
        if (!_accountId) {
            _accountId = await createAccount(_accessToken, _form);
        }
    }
    if (_newContact) {
        await linkContactToAccount(_accessToken, _contactId, _accountId);
        //await createContactIndentity(_accessToken, _form, _contactId);
    }
    await createContactIndentity(_accessToken, _form, _contactId);
    const _refnum = entry.refnum;
    if (_refnum) {
        const _opptyId = await createApplication(_accessToken, _form, _contactId, _accountId, _refnum)
        console.log('========_opptyId=========' + _opptyId)
        //await linkContactToApplication(_accessToken, _contactId, _opptyId);

    }
}


module.exports = {
    lifecycles: {
        afterUpdate: async (entry) => {
            console.log('---------------afterUpdate---------------');
            const _form = entry.form ? entry.form : null;
            console.log(entry.status); //TODO: add && _form.status != draft
            console.log(entry.refnum);
            if (_form) { //TODO: add && _form.status != draft
                await sendToCRM(entry);
            }
        },
    }
};
