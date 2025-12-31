import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { prisma } from "@/lib/db"

function titleCase(s: string) {
  return s.replace(/(^|\s)([a-z])/g, (m) => m.toUpperCase())
}

function nameFor(action: string, slipType?: string) {
  const t = (slipType || "").toLowerCase()
  switch (action) {
    case "nin.slip":
      return `NIN Slip - ${titleCase(t || "Basic")}`
    case "nin.printout":
      return t ? `NIN Printout - ${titleCase(t)}` : `NIN Printout - Basic Data Slip`
    case "bvn.advanced":
      return `BVN Advanced Slip`
    case "bvn.printout":
      return t === "plastic" ? `BVN Plastic Slip` : `BVN Printout`
    case "bvn.retrieval_phone":
      return t === "plastic" ? `BVN Plastic Slip` : `BVN Printout`
    case "cac.info":
      return `CAC Info Slip`
    case "cac.status":
      return `CAC Status Certificate`
    case "tin.verify":
      return t === "certificate" ? `TIN Certificate` : `TIN Slip - ${titleCase(t || "Basic")}`
    case "passport.verify":
      return `Passport Slip`
    case "drivers_license.verify":
      return `Drivers License Slip`
    case "phone.verify_advanced":
      return `Phone Slip`
    case "plate.verify":
      return `Plate Slip`
    case "voters.verify":
      return `Voters Card Slip - ${titleCase(t || "Basic")}`
    default:
      return `${action} Slip`
  }
}

function htmlFor(action: string, name: string, slipType?: string) {
  if (action === "voters.verify") {
    const t = String(slipType || "basic").toLowerCase()
    if (t === "full") {
      const frontBg = "/assets/voters-card-front.jpg"
      const backBg = "/assets/voters-card-back.jpg"
      const base = `<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <style>
      html, body { margin:0; padding:0; }
      body { font-family: Segoe UI, Arial, sans-serif; color: #000; }
      .wrap { width: 1024px; margin: 0 auto; }
      .card { position: relative; width: 1024px; height: 640px; margin: 12px 0; }
      .bg { position:absolute; inset:0; width:100%; height:100%; object-fit: cover; }
      .txt { position:absolute; color:#000; font-weight:700; }
      .small { font-weight:600; font-size: 20px; }
      .med { font-weight:700; font-size: 26px; }
      .big { font-weight:800; font-size: 32px; }
      .vin { left: 360px; top: 96px; }
      .name { left: 360px; top: 200px; }
      .dob { left: 360px; top: 260px; }
      .gender { left: 760px; top: 260px; }
      .addr { left: 360px; top: 360px; width: 580px; }
      .delim { left: 360px; top: 150px; }
      .code { left: 64px; top: 96px; }
      .photo { position:absolute; left: 64px; top: 160px; width: 260px; height: 320px; object-fit: cover; border: 2px solid #333; background: #fff; }
      .footer { text-align:center; font-size:12px; color:#333; margin: 4px 0 8px; }
    </style>
  </head>
  <body>
    <div class='wrap'>
      <div class='footer'>Generated: {{generated_at}}</div>
      <div class='card'>
        <img class='bg' src='${frontBg}' alt='Front'>
        <div class='txt small code'>CODE: {{code}}</div>
        <div class='txt small delim'>DELIM: {{lga}} | {{state}}</div>
        <div class='txt med vin'>VIN: {{number}}{{vin}}</div>
        <div class='txt big name'>{{full_name}}{{first_name}} {{last_name}}</div>
        <div class='txt small dob'>DATE OF BIRTH {{dob}}</div>
        <div class='txt small gender'>GENDER {{gender}}</div>
        <div class='txt small addr'>ADDRESS {{address}}</div>
        <img class='photo' src='{{photo}}' alt='Photo' onerror='this.style.display="none"'>
      </div>
      <div class='card'>
        <img class='bg' src='${backBg}' alt='Back'>
      </div>
    </div>
  </body>
</html>`
      return base
    }
  }

  if (action === "bvn.printout" || action === "bvn.retrieval_phone") {
    const t = String(slipType || "basic").toLowerCase()
    if (t === "plastic") {
      const bg = `/assets/bvn-plastic.jpeg?v=${new Date().getTime()}`
      const plastic = `<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <style>
      html, body { margin:0; padding:0; }
      body { font-family: Segoe UI, Arial, sans-serif; color: #000; }
      .wrap { width: 794px; margin: 0 auto; }
      .header-text { text-align:center; font-size: 18px; color:#333; margin: 12px 0 12px; }
      
      /* Card Layout */
      .stack { position: relative; width: 85.6mm; height: calc(53.98mm * 2); margin: 0 auto; border: 2px solid #000; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); background: #fff; }
      .inner { position:absolute; left:0; top:0; width: 1011px; height: 639px; transform: scale(0.32); transform-origin: top left; }
      .card { position:absolute; left:0; width:1011px; height:639px; }
      .top { top:0; }
      .bottom { top:650px; background:#fff; }
      .bg-layer { position:absolute; left:0; top:0; width:100%; height:100%; background-image: url('${bg}'); background-size: 100% auto; background-repeat: no-repeat; }
      .front-bg { background-position: top center; }
      .back-bg { background-position: bottom center; }
      
      /* Text Styles */
      .txt { position:absolute; font-weight: 800; color: #000; text-transform: uppercase; z-index: 10; }
      .lbl { position:absolute; font-weight: 700; color: #000; font-size: 18px; text-transform: uppercase; z-index: 10; }
      
      /* Header Brand */
      .brand-box { position:absolute; left: 40px; top: 40px; }
      .brand-title { color: #2a3375; font-weight: 800; font-size: 24px; line-height: 1.1; font-family: sans-serif; }

      /* Photo */
      .photo { 
        position:absolute; 
        left: 40px; 
        top: 150px; 
        width: 220px; 
        height: 280px; 
        object-fit: cover; 
        border-radius: 4px;
        background: #eee;
      }
      
      /* Fields */
      .l-surname { left: 290px; top: 155px; }
      .v-surname { left: 290px; top: 180px; font-size: 32px; color: #000; }
      
      .l-firstname { left: 290px; top: 235px; }
      .v-firstname { left: 290px; top: 260px; font-size: 32px; color: #000; }
      
      .l-dob { left: 290px; top: 315px; }
      .v-dob { left: 290px; top: 340px; font-size: 28px; color: #000; }
      
      .l-gender { left: 560px; top: 315px; }
      .v-gender { left: 560px; top: 340px; font-size: 28px; color: #000; }
      
      .l-issued { left: 780px; top: 375px; font-size: 18px; text-align: center; width: 150px; }
      .v-issued { left: 780px; top: 398px; font-size: 22px; text-align: center; width: 150px; font-weight: 800; }
      
      /* Fingerprint/NGA */
      .nga {
        position: absolute;
        left: 790px;
        top: 300px;
        font-size: 42px;
        font-weight: 900;
        color: #009933;
        text-align: center;
        width: 140px;
      }

      /* BVN Footer */
      .bvn-title {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 120px;
        text-align: center;
        font-size: 22px;
        color: #2a3375;
        font-weight: 700;
        text-transform: uppercase;
      }
      .bvn-val { 
        position:absolute; 
        left: 0;
        right: 0;
        bottom: 40px; 
        text-align: center;
        font-size: 64px; 
        font-weight: 800; 
        letter-spacing: 4px;
        color: #000;
        font-family: monospace;
      }

      .qr[src=""], .photo[src=""] { display:none }
    </style>
  </head>
  <body>
    <div class='wrap'>
      <div class='header-text'>Please find below your BVN Plastic Slip</div>
      <div class='stack'>
        <div class='inner'>
          <!-- Front -->
          <div class='card top'>
            <div class='bg-layer front-bg'></div>
            
            <img class='photo' src='{{image}}' alt='' onerror='this.style.display="none"'>
            
            <div class='lbl l-surname'>SURNAME</div>
            <div class='txt v-surname'>{{surname}}</div>
            
            <div class='lbl l-firstname'>FIRSTNAME/OTHER NAMES</div>
            <div class='txt v-firstname'>{{first_name}} {{middle_name}}</div>
            
            <div class='lbl l-dob'>DATE OF BIRTH</div>
            <div class='txt v-dob'>{{dob}}</div>
            
            <div class='lbl l-gender'>GENDER</div>
            <div class='txt v-gender'>{{gender}}</div>
            
            <div class='lbl l-issued'>ISSUE DATE</div>
            <div class='txt v-issued'>{{issue_date}}</div>
            
            <div class='nga'>NGA</div>
            
            <div class='bvn-title'>BANK VERIFICATION NUMBER (BVN)</div>
            <div class='bvn-val'>{{bvn}}</div>
          </div>
          
          <div class='card bottom'>
             <div class='bg-layer back-bg'></div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`
      return plastic
    }
    const logo = '/assets/bvn-printout.png'
    const base = `<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <style>
      body { font-family: Segoe UI, Arial, sans-serif; color: #000; }
      .wrap { width: 794px; margin: 0 auto; }
      .header { border: 2px solid #777; padding: 0; display: grid; grid-template-columns: 230px 1fr; align-items: center; min-height: 64px; }
      .brand { display: flex; align-items: stretch; height: 100%; width: 100%; }
      .brand img { height: 100%; width: 100%; object-fit: contain; display: block; margin: 0; }
      .msg { text-align: center; font-size: 13px; }
      .date { text-align: right; font-size: 12px; margin: 4px 0; }
      .grid { display: grid; grid-template-columns: 360px 1fr; gap: 16px; margin-top: 12px; }
      .photo { width: 360px; height: 320px; border: 1px solid #b3b3b3; object-fit: cover; }
      .card { border: 1px solid #8f8f8f; }
      .card-title { background: #f1f1f1; padding: 6px; text-align: center; font-weight: 600; border-bottom: 2px solid #8f8f8f; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; }
      td { border: 1px solid #a8a8a8; padding: 6px 8px; font-size: 12px; }
      .label { width: 42%; }
      .caps { text-transform: uppercase; }
      .note { margin-top: 10px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class='wrap'>
      <div class='header'>
        <div class='brand'>
          <img src='${logo}' alt='Bank Verification Number'>
        </div>
        <div class='msg'>The Bank Verification Number has successfully been verified.</div>
      </div>
      <div class='grid'>
        <img class='photo' src='{{image}}' alt='Photo'>
        <div>
          <div class='date'>Date: {{generated_at}}</div>
          <div class='card'>
            <div class='card-title'>Personal Information</div>
            <table>
              <tr><td class='label'>BVN</td><td>{{bvn}}</td></tr>
              <tr><td class='label'>NIN</td><td>{{nin}}</td></tr>
              <tr><td class='label'>First Name</td><td class='caps'>{{first_name}}</td></tr>
              <tr><td class='label'>Last Name</td><td class='caps'>{{last_name}}</td></tr>
              <tr><td class='label'>Middle Name</td><td class='caps'>{{middle_name}}</td></tr>
              <tr><td class='label'>Phone</td><td>{{phone_number}}</td></tr>
              <tr><td class='label'>Email</td><td>{{email}}</td></tr>
              <tr><td class='label'>Date of birth</td><td>{{dob}}</td></tr>
              <tr><td class='label'>Gender</td><td class='caps'>{{gender}}</td></tr>
              <tr><td class='label'>Enrollment Bank</td><td>{{enrollment_bank}}</td></tr>
              <tr><td class='label'>Enrollment Branch</td><td>{{enrollment_branch}}</td></tr>
              <tr><td class='label'>Registration Date</td><td>{{registration_date}}</td></tr>
              <tr><td class='label'>Address</td><td>{{residential_address}}</td></tr>
              <tr><td class='label'>State</td><td>{{state_of_residence}}</td></tr>
            </table>
          </div>
        </div>
      </div>
      <div class='note'>NOTE: ..</div>
    </div>
  </body>
</html>`
    return base
  }

  if (action === "nin.printout" || action === "nin.advanced" || action === "nin.slip") {
    const t = String(slipType || "basic").toLowerCase()
    if (t === "premium") {
      const bg = "/assets/premium-blank.jpg"
      const premium = `<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <style>
      html, body { margin:0; padding:0; }
      body { font-family: Segoe UI, Arial, sans-serif; color: #000; }
      .wrap { width: 794px; margin: 0 auto; }
      .header-text { text-align:center; font-size: 18px; color:#333; margin: 12px 0 12px; }
      /* ID-1 physical card size: 85.60mm × 53.98mm */
      .stack { position: relative; width: 85.6mm; height: calc(53.98mm * 2); margin: 0 auto; border: 2px solid #000; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); background: #fff; }
      .inner { position:absolute; left:0; top:0; width: 1080px; height: 1388px; transform: scale(0.299); transform-origin: top left; }
      .card { position:absolute; left:0; width:1080px; height:674px; }
      .top { top:0; }
      .bottom { top:714px; background:#fff; }
      .bg { position:absolute; left:0; top:0; width:100%; height:100%; object-fit: cover; }
      .value { position:absolute; font-size: 26px; font-weight: 700; text-transform: uppercase; color:#222; }
      .label { position:absolute; font-size: 26px; color:#5a5a5a }
      .header { position:absolute; left: 38px; top: 18px; color:#0a7a43; font-weight: 800; font-size: 45px; letter-spacing:1px }
      .subheader { position:absolute; left: 38px; top: 68px; color:#0a7a43; font-weight: 600; font-size: 30px }
      .photo { position:absolute; left: 46px; top: 120px; width: 260px; height: 320px; object-fit: cover; border:0; }
      .qr { position:absolute; left: 748px; top: 84px; width: 236px; height: 236px; object-fit: contain; }
      .nga { position:absolute; left: 748px; top: 342px; width: 236px; text-align: center; font-weight: 800; font-size: 45px; letter-spacing:2px; }
      .lab-issue { position:absolute; left: 748px; top: 400px; width: 236px; text-align: center; font-size: 27px; font-weight: 700; color:#5a5a5a; z-index: 2 }
      .issue { position:absolute; left: 748px; top: 440px; width: 236px; text-align: center; font-size: 27px; font-weight: 800; letter-spacing:1px; z-index: 2 }
      .lab-surname { left: 320px; top: 150px }
      .lab-given { left: 320px; top: 229px }
      .lab-dob { left: 320px; top: 313px }
      .lab-gender { left: 577px; top: 318px }
      .surname { left: 320px; top: 187px }
      .given { left: 320px; top: 266px }
      .dob { left: 320px; top: 350px }
      .gender { left: 577px; top: 355px }
      .nin-label { position:absolute; left: 0; right: 0; bottom: 118px; text-align: center; font-size: 34px; font-weight: 700; color:#333 }
      .nin { position:absolute; left: 0; right: 0; bottom: 36px; text-align: center; font-size: 72px; font-weight: 800; letter-spacing:7.2px }
      .disc-wrap { position:absolute; inset:0; display:flex; align-items:center; justify-content:center }
      .disc { width: 880px; color:#222; transform: rotate(180deg); }
      .disc h3 { text-align:center; font-size: 42px; font-weight: 800; margin: 0 0 8px }
      .disc h4 { text-align:center; font-size: 26px; font-weight: 600; margin: 0 0 12px; font-style: italic }
      .disc p { font-size: 26px; line-height: 1.45; margin: 8px 0 }
      .disc .caution { text-align:center; font-size: 26px; font-weight: 800; margin: 10px 0 }
      .qr[src=""], .photo[src=""] { display:none }
    </style>
  </head>
  <body>
    <div class='wrap'>
      <div class='header-text'>Please find below your Improved NIN Slip</div>
      <div class='header-text'>You may cut it out of the paper, fold and laminate as desired.</div>
      <div class='header-text'>For your security & privacy, please DO NOT permit others to make photocopies of this slip.</div>
      <div class='stack'>
      <div class='inner'>
      <div class='card top'>
        <img class='bg' src='${bg}' alt='NIN Premium Slip Background'>
        <div class='header'>FEDERAL REPUBLIC OF NIGERIA</div>
        <div class='subheader'>DIGITAL NIN SLIP</div>
        <img class='photo' src='{{image}}' alt='' onerror='this.style.display="none"'>
        <img class='qr' src='{{qr_code}}' alt='' onerror='this.style.display="none"'>
      <div class='value nga'>NGA</div>
      <div class='label lab-issue'>ISSUE DATE</div>
        <div class='issue'>{{issue_date}}</div>
        <div class='label lab-surname'>SURNAME/NOM</div>
        <div class='label lab-given'>GIVEN NAMES/PRENOMS</div>
        <div class='label lab-dob'>DATE OF BIRTH</div>
        <div class='label lab-gender'>SEX/SEXE</div>
        <div class='value surname'>{{surname}}</div>
        <div class='value given'>{{given_names}},</div>
        <div class='value dob'>{{dob}}</div>
        <div class='value gender'>{{gender}}</div>
        <div class='nin-label'>National Identification Number (NIN)</div>
        <div class='nin'>{{nin_spaced}}</div>
      </div>
      <div class='card bottom'>
        <div class='disc-wrap'>
          <div class='disc'>
            <h3>DISCLAIMER</h3>
            <h4>Trust, but verify</h4>
            <p>Kindly ensure each time this ID is presented, that you verify the credentials using a Government APPROVED verification resource.</p>
            <p>The details on the front of this NIN Slip must EXACTLY match the verification result.</p>
            <div class='caution'>CAUTION!</div>
            <p>If this NIN was not issued to the person on the front of this document, please DO NOT attempt to scan, photocopy or replicate the personal data contained herein.</p>
            <p>You are only permitted to scan the barcode for the purpose of identity verification.</p>
            <p>The FEDERAL GOVERNMENT OF NIGERIA assumes no responsibility if you accept any variance on the scan result or do not scan the 2D barcode overleaf.</p>
      </div>
      </div>
    </div>
    </div>
  </body>
</html>`
      return premium
    }
    if (t === "standard") {
      const bg = "/assets/standard-blank.jpg"
      const standard = `<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <style>
      html, body { margin:0; padding:0; }
      body { font-family: Segoe UI, Arial, sans-serif; color: #000; }
      .wrap { width: 794px; margin: 0 auto; }
      .header-text { text-align:center; font-size: 18px; color:#333; margin: 12px 0 12px; }
      .stack { position: relative; width: 85.6mm; height: calc(53.98mm * 2); margin: 0 auto; border: 2px solid #000; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); background: #fff; }
      .inner { position:absolute; left:0; top:0; width: 1080px; height: 1388px; transform: scale(0.299); transform-origin: top left; }
      .card { position:absolute; left:0; width:1080px; height:674px; }
      .top { top:0; }
      .bottom { top:714px; background:#fff; }
      .bg { position:absolute; left:0; top:0; width:100%; height:100%; object-fit: cover; }
      .value { position:absolute; font-size: 24px; font-weight: 700; text-transform: uppercase; color:#222; }
      .label { position:absolute; font-size: 24px; color:#5a5a5a }
      .photo { position:absolute; left: 48px; top: 140px; width: 240px; height: 300px; object-fit: cover; border:0; }
      .qr { position:absolute; left: 756px; top: 120px; width: 216px; height: 216px; object-fit: contain; }
      .nga { position:absolute; left: 756px; top: 356px; width: 216px; text-align: center; font-weight: 800; font-size: 45px; letter-spacing:2px; }
      .lab-issue { position:absolute; left: 756px; top: 412px; width: 216px; text-align: center; font-size: 26px; font-weight: 700; color:#5a5a5a }
      .issue { position:absolute; left: 756px; top: 455px; width: 216px; text-align: center; font-size: 26px; font-weight: 800 }
      .lab-surname { left: 322px; top: 160px; font-size: 22px; color:#666 }
      .lab-given { left: 322px; top: 230px; font-size: 22px; color:#666 }
      .lab-dob { left: 322px; top: 300px; font-size: 22px; color:#666 }
      .lab-gender { left: 560px; top: 305px; font-size: 22px; color:#666 }
      .surname { left: 322px; top: 193px }
      .given { left: 322px; top: 263px }
      .dob { left: 322px; top: 333px }
      .gender { left: 560px; top: 338px }
      .nin-label { position:absolute; left: 0; right: 0; bottom: 132px; text-align: center; font-size: 30px; font-weight: 700; color:#333 }
      .nin { position:absolute; left: 0; right: 0; bottom: 58px; text-align: center; font-size: 68px; font-weight: 800; letter-spacing:6.8px }
      .nin-note { position:absolute; left:0; right:0; bottom: 52px; text-align:center; font-size: 18px; font-style: italic; color:#666 }
      .disc-wrap { position:absolute; inset:0; display:flex; align-items:center; justify-content:center }
      .disc { width: 880px; color:#222; transform: rotate(180deg); }
      .disc h3 { text-align:center; font-size: 42px; font-weight: 800; margin: 0 0 8px }
      .disc h4 { text-align:center; font-size: 26px; font-weight: 600; margin: 0 0 12px; font-style: italic }
      .disc p { font-size: 22px; line-height: 1.45; margin: 8px 0 }
      .disc .caution { text-align:center; font-size: 26px; font-weight: 800; margin: 10px 0 }
      .qr[src=""], .photo[src=""] { display:none }
    </style>
  </head>
  <body>
    <div class='wrap'>
      <div class='header-text'>Please find below your Improved NIN Slip</div>
      <div class='header-text'>You may cut it out of the paper, fold and laminate as desired.</div>
      <div class='header-text'>For your security & privacy, please DO NOT permit others to make photocopies of this slip.</div>
      <div class='stack'>
      <div class='inner'>
      <div class='card top'>
        <img class='bg' src='${bg}' alt='NIN Standard Slip Background'>
        <img class='photo' src='{{image}}' alt='' onerror='this.style.display="none"'>
        <img class='qr' src='{{qr_code}}' alt='' onerror='this.style.display="none"'>
        <div class='value nga'>NGA</div>
        <div class='label lab-issue'>ISSUE DATE</div>
        <div class='issue'>{{issue_date}}</div>
        <div class='label lab-surname'>Surname/Nom</div>
        <div class='label lab-given'>Given Names/Prenoms</div>
        <div class='label lab-dob'>Date of Birth</div>
        <div class='label lab-gender'>Sex/Sexe</div>
        <div class='value surname'>{{surname}}</div>
        <div class='value given'>{{given_names}}</div>
        <div class='value dob'>{{dob}}</div>
        <div class='value gender'>{{gender}}</div>
        <div class='nin-label'>National Identification Number (NIN)</div>
        <div class='nin'>{{nin_spaced}}</div>
        <div class='nin-note'>Kindly ensure you scan the barcode to verify the credentials.</div>
      </div>
      <div class='card bottom'>
        <div class='disc-wrap'>
          <div class='disc'>
            <h3>DISCLAIMER</h3>
            <h4>Trust, but verify</h4>
            <p>Kindly ensure each time this ID is presented, that you verify the credentials using a Government APPROVED verification resource.</p>
            <p>The details on the front of this NIN Slip must EXACTLY match the verification result.</p>
            <div class='caution'>CAUTION!</div>
            <p>If this NIN was not issued to the person on the front of this document, please DO NOT attempt to scan, photocopy or replicate the personal data contained herein.</p>
            <p>You are only permitted to scan the barcode for the purpose of identity verification.</p>
            <p>The FEDERAL GOVERNMENT OF NIGERIA assumes no responsibility if you accept any variance on the scan result or do not scan the 2D barcode overleaf.</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  </body>
</html>`
      return standard
    }
    if (t === "regular") {
      const bg = "/assets/regular-blank.jpg"
      const regular = `<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <style>
      @page { size: 1024px 478px; margin: 0; }
      html, body { margin:0; padding:0; }
      body { font-family: Segoe UI, Arial, sans-serif; color: #000; }
      .page { position: relative; width: 1024px; height: 478px; }
      .bg { position:absolute; left:0; top:0; width:100%; height:100%; object-fit: cover; }
      /* Header elements are part of background image; no extra overlays */

      .panel { position:absolute; left: 40px; right: 40px; top: 120px; height: 260px; display:grid; grid-template-columns: 320px 320px 1fr; grid-template-rows: 64px 64px 64px 64px; }
      .cell { position: relative; display:flex; align-items:center; padding: 0 12px; font-size: 15px; }
      .cell.lab { font-weight: 500; color:#222 }
      .cell.val { font-weight: 500; color:#222 }
      .cell.val.name-val { text-transform: uppercase }
      .cell.val.meta { position:absolute; right: 12px; bottom: 8px; }
      .cell.lab.meta { position:absolute; right: 12px; top: 8px; }
      .pair { display:flex; align-items:center; justify-content:flex-start; padding: 0 12px; }
      .pair .lab { margin-left: 0; transform: translateX(-85px) }
      .pair .val { margin-left: 0; margin-right: 0; transform: translateX(-69px); text-transform: uppercase }
      .c4 .val { transform: translateX(-59px) }
      /* lines are provided by background image; no extra borders */

      /* Assign cells to grid */
      .t-lab { grid-column: 1; grid-row: 1; margin-top: 22px; padding-left: 2px }
      .t-val { grid-column: 2; grid-row: 1; margin-top: 22px }
      .c1 { grid-column: 2; grid-row: 1; margin-top: 22px }

      .nin-lab { grid-column: 1; grid-row: 2; padding-left: 2px }
      .nin-val { grid-column: 2; grid-row: 2; font-size: 15px; font-weight: 500; letter-spacing: 0.3px; margin-left: -240px }
      .t-val, .issue-val { margin-left: -240px }
      .c2 { grid-column: 2; grid-row: 2 }

      .issue-lab { grid-column: 1; grid-row: 3; margin-top: -30px; padding-left: 2px }
      .issue-val { grid-column: 2; grid-row: 3; margin-top: -30px }
      .c3 { grid-column: 2; grid-row: 3; margin-top: -30px }

      .c4 { grid-column: 2; grid-row: 4; margin-top: -70px }

      .addr { grid-column: 3; grid-row: 1 / span 3; padding: 12px; font-size: 14px; position: relative; }
      .addr .lab { font-weight: 700; margin-top: 10px; color:#222 }
      .addr .lines { margin-top: 9px; margin-right: 160px }
      .addr .lines div { margin: 6px 0; font-weight: 600; text-transform: uppercase; font-size: 12px; color:#222 }
      .addr .lines div:nth-child(2) { margin-top: 58px }
      .addr .lines div:nth-child(3) { margin-top: 18px }
      .addr .addr-photo { position:absolute; right: 12px; top: 19px; width: 140px; height: 188px; border: 1px solid #777; object-fit: cover; transform: translateX(15px) }

      /* Bottom text/icons are present in background image; avoid overlays */
      .qr[src=""], .photo[src=""] { display:none }
    </style>
  </head>
  <body>
    <div class='page'>
      <img class='bg' src='${bg}' alt='NIN Regular Slip Background'>
      <div class='panel'>
        <div class='cell lab t-lab'>Tracking ID</div>
        <div class='cell val t-val col2'>{{tracking_id}}</div>

        <div class='cell lab nin-lab row2'>NIN</div>
        <div class='cell val nin-val row2 col2'>{{nin}}</div>

        <div class='cell lab issue-lab row3'>Issue Date</div>
        <div class='cell val issue-val row3 col2'>{{issue_date}}</div>

        <div class='cell pair c1'><div class='lab'>Surname</div><div class='val name-val'>{{surname}}</div></div>

        <div class='cell pair c2 row2'><div class='lab'>First Name</div><div class='val name-val'>{{first_name}}</div></div>

        <div class='cell pair c3 row3'><div class='lab'>Middle Name</div><div class='val name-val'>{{middle_name}}</div></div>

        <div class='cell pair c4 row4'><div class='lab'>Gender</div><div class='val'>{{gender}}</div></div>

        <div class='addr col3'>
            <div class='lab'>Address:</div>
          <div class='lines'>
            <div>{{residence_address}}{{address}}</div>
            <div>{{residence_town}}</div>
            <div>{{residence_state}}</div>
          </div>
          <img class='addr-photo' src='{{image}}' alt='Photo' onerror='this.style.display="none"'>
        </div>
      </div>
      
    </div>
  </body>
</html>`
      return regular
    }
    const coat = '/assets/coat-of-arms.png'
    const nimc = '/assets/nimc-logo.png'
    const base = `<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <style>
      body { font-family: Segoe UI, Arial, sans-serif; color: #000; }
      .wrap { width: 794px; margin: 0 auto; }
      .head { display: grid; grid-template-columns: 140px 1fr 160px; align-items: center; margin-top: 8px; }
      .head img { object-fit: contain; display: block; }
      .title { text-align: center; }
      .title .top { font-weight: 600; font-size: 18px; }
      .title .sub { font-weight: 600; font-size: 16px; }
      .verified { color: #1f7a36; font-size: 24px; font-weight: 600; margin-top: 12px; }
      .grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; margin-top: 16px; }
      .photo { width: 120px; height: 140px; border: 1px solid #999; object-fit: cover; }
      .labels { font-size: 13px; }
      .labels .row { display: grid; grid-template-columns: 180px 1fr; gap: 8px; margin: 6px 0; }
      .labels .name { font-weight: 600; }
      .right { font-size: 12px; color: #333; }
      .right .note { margin-top: 8px; }
      .right ul { margin: 8px 0 0 16px; }
      .right ul li { margin: 4px 0; }
      .red { color: #d32f2f; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class='wrap'>
      <div class='head'>
        <img src='${coat}' alt='Coat of Arms' style='height: 64px;'>
        <div class='title'>
          <div class='top'>Federal Republic of Nigeria</div>
          <div class='sub'>Verified NIN Details</div>
        </div>
        <img src='${nimc}' alt='NIMC' style='height: 48px;'>
      </div>

      <div class='grid'>
        <div>
          <div class='labels'>
            <div class='row'><div class='name'>First Name:</div><div>{{first_name}}</div></div>
            <div class='row'><div class='name'>Middle Name:</div><div>{{middle_name}}</div></div>
            <div class='row'><div class='name'>Last Name:</div><div>{{surname}}</div></div>
            <div class='row'><div class='name'>Date of birth:</div><div>{{dob}}{{dateOfBirth}}</div></div>
            <div class='row'><div class='name'>Gender:</div><div>{{gender}}</div></div>
            <div class='row'><div class='name'>NIN Number:</div><div>{{nin}}</div></div>
            <div class='row'><div class='name'>Tracking ID:</div><div>{{tracking_id}}{{trackingId}}</div></div>
            <div class='row'><div class='name'>Phone Number:</div><div>{{phone_number}}</div></div>
            <div class='row'><div class='name'>Email:</div><div>{{email}}</div></div>
            <div class='row'><div class='name'>Employment Status:</div><div>{{employment_status}}</div></div>
            <div class='row'><div class='name'>Marital Status:</div><div>{{marital_status}}</div></div>
            <div class='row'><div class='name'>Education Level:</div><div>{{educational_level}}</div></div>
            <div class='row'><div class='name'>Residence State:</div><div>{{residence_state}}</div></div>
            <div class='row'><div class='name'>Residence LGA/Town:</div><div>{{residence_town}}</div></div>
            <div class='row'><div class='name'>Birth State:</div><div>{{birth_state}}</div></div>
            <div class='row'><div class='name'>Birth LGA:</div><div>{{birth_lga}}</div></div>
            <div class='row'><div class='name'>Birth Country:</div><div>{{birth_country}}</div></div>
            <div class='row'><div class='name'>Height:</div><div>{{height}}</div></div>
            <div class='row'><div class='name'>Parent First Name:</div><div>{{parent_first_name}}</div></div>
            <div class='row'><div class='name'>Spoken Language:</div><div>{{spoken_language}}</div></div>
            <div class='row'><div class='name'>Central ID:</div><div>{{central_id}}</div></div>
            <div class='row'><div class='name'>Address:</div><div>{{address}}</div></div>
            <div class='row'><div class='name'>NOK First Name:</div><div>{{nok_firstname}}</div></div>
            <div class='row'><div class='name'>NOK Middle Name:</div><div>{{nok_middlename}}</div></div>
            <div class='row'><div class='name'>NOK Surname:</div><div>{{nok_surname}}</div></div>
            <div class='row'><div class='name'>NOK Address 1:</div><div>{{nok_address1}}</div></div>
            <div class='row'><div class='name'>NOK Address 2:</div><div>{{nok_address2}}</div></div>
            <div class='row'><div class='name'>NOK State:</div><div>{{nok_state}}</div></div>
            <div class='row'><div class='name'>NOK LGA/Town:</div><div>{{nok_lga_town}}</div></div>
            <div class='row'><div class='name'>NOK Postal Code:</div><div>{{nok_postalcode}}</div></div>
          </div>
          <img class='photo' src='{{image}}' alt='Photo' />
        </div>
        <div class='right'>
          <div class='verified'>Verified</div>
          <div class='note'>This is a property of National Identity Management Commission (NIMC), Nigeria.
            If found, please return to the nearest NIMC's office or contact +234 815 769 1214, +234 815 769 1071
          </div>
          <ul>
            <li>This NIN slip remains the property of the Federal Republic of Nigeria, and MUST be surrendered on demand;</li>
            <li>This NIN slip does not imply nor confer citizenship of the Federal Republic of Nigeria on the individual the document is issued to;</li>
            <li>This NIN slip is valid for the lifetime of the holder and <span class='red'>DOES NOT EXPIRE.</span></li>
          </ul>
        </div>
      </div>
    </div>
  </body>
</html>`
    return base
  }
  const base = `<div style='font-family:Arial,sans-serif;padding:24px'>
  <h2 style='text-align:center;margin:0;'>UFriends Information Technology</h2>
  <h3 style='text-align:center;margin:8px 0;'>${name}</h3>
  <div style='margin-top:16px;font-size:12px;'>
    <div>Date: {{date_of_birth}}{{dob}}</div>
    <div>Name: {{full_name}}{{first_name}} {{last_name}}</div>
    <div>NIN: {{nin}}</div>
    <div>BVN: {{bvn}}</div>
    <div>Passport No: {{passport_number}}</div>
    <div>Driver License: {{licenseNumber}}{{license_number}}</div>
    <div>Phone: {{phoneNumber}}{{phone}}</div>
    <div>Plate: {{plate_number}}{{plateNumber}}</div>
    <div>VIN: {{number}}{{vin}}</div>
    <div>RC/BN: {{rc_number}}{{rcNumber}}</div>
    <div>Entity: {{company_name}}{{name}}</div>
    <div>TIN: {{tin}}</div>
  </div>
  <div style='position:fixed;bottom:24px;font-size:10px;'>Note: Generated by UFriends.com.ng</div>
</div>`
  return `<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>${base}</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN", "AGENT", "USER"] })
    if (!auth.ok) return auth.response

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || "").trim()
    const slipType = String(body?.slipType || "").trim() || undefined
    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 })

    const name = nameFor(action, slipType)
    const existing = await prisma.ninTemplate.findFirst({ where: { name } })
    const html = htmlFor(action, name, slipType)
    const matches = Array.from(html.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`)
    const placeholders = [...new Set(matches)]
    if (existing && existing.isActive) {
      const updated = await prisma.ninTemplate.update({
        where: { id: existing.id },
        data: { templateContent: html, placeholders }
      })
      return NextResponse.json({ ok: true, templateId: updated.id, name })
    }

    const created = await prisma.ninTemplate.upsert({
      where: { id: existing?.id || "" },
      update: { name, type: "digital", templateContent: html, placeholders, isActive: true },
      create: { name, type: "digital", templateContent: html, placeholders, isActive: true, createdBy: auth.user.id },
    })
    return NextResponse.json({ ok: true, templateId: created.id, name })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
