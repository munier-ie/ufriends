
// Simulate the data processing logic in app/api/pdf/route.ts
function testMapping() {
    // 1. Simulating the raw data from Prembly (based on user snippet)
    const src = {
        nin: "12345678901",
        first_name: "CHIDINMA",
        last_name: "EZE",
        middle_name: "SANDBOX",
        date_of_birth: "12-05-1990", // assuming format
        gender: "F",
        photo: "base64wouldbehere",
        phone_number: "08012345678"
    };

    console.log("Source Data:", JSON.stringify(src, null, 2));

    // 2. Extraction logic from route.ts
    const firstName = src.first_name || src.firstname || src.firstName || src.given_names || src.givenNames || src.given_name || ""
    const lastName = src.last_name || src.lastname || src.lastName || src.surname || ""
    const middleName = src.middle_name || src.middlename || src.middleName || src.other_names || src.otherNames || ""
    const givenNames = src.given_names || src.givenNames || [firstName, middleName].filter(Boolean).join(" ")
    const gender = src.gender || src.sex || ""
    const sex = gender
    const nin = src.nin || src.nin_number || src.ninNumber || src.idNumber || ""
    const address = src.address || src.residential_address || src.residence_address || src.homeAddress || src.residentialAddress || ""

    const aliases = {};

    // 3. Alias population logic from route.ts (my fix)
    aliases.surname = lastName
    aliases.Surname = lastName
    aliases.SURNAME = lastName
    aliases.last_name = lastName
    aliases.LASTNAME = lastName

    aliases.first_name = firstName
    aliases.FirstName = firstName
    aliases.FIRSTNAME = firstName
    aliases.FIRST_NAME = firstName

    aliases.middle_name = middleName
    aliases.MiddleName = middleName
    aliases.MIDDLENAME = middleName

    aliases.given_names = givenNames
    aliases.GivenNames = givenNames
    aliases.GIVEN_NAMES = givenNames

    aliases.sex = sex
    aliases.SEX = sex
    aliases.gender = gender
    aliases.GENDER = gender

    aliases.nin = nin
    aliases.NIN = nin

    // Flatten logic
    for (const [k, v] of Object.entries(src)) {
        if (v && (typeof v === 'string' || typeof v === 'number')) {
            aliases[k] = v;
            aliases[k.toUpperCase()] = v;
            aliases[k.toLowerCase()] = v;
        }
    }

    // 4. Test Template Substitution
    const templateSample = "Name: {{SURNAME}} {{GIVEN_NAMES}}\nNIN: {{NIN}}";

    let output = templateSample.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, key) => {
        const path = String(key)
        // simplified lookup for test
        const val = aliases[path]
        return (val !== undefined && val !== null) ? String(val) : "[[MISSING]]"
    })

    console.log("\n--- MAPPING RESULTS ---");
    console.log("SURNAME:", aliases.SURNAME);
    console.log("GIVEN_NAMES:", aliases.GIVEN_NAMES);
    console.log("NIN:", aliases.NIN);

    console.log("\n--- TEMPLATE OUTPUT ---");
    console.log(output);
}

testMapping();
