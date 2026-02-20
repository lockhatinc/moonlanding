import {
  detectXSS,
  detectSQLInjection,
  detectPathTraversal,
  validateFileUpload,
  sanitizeDeep
} from '@/lib/validation';

export const MaliciousPayloads = {
  xss: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<svg onload=alert("XSS")>',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '<select onfocus=alert("XSS") autofocus>',
    '<textarea onfocus=alert("XSS") autofocus>',
    '<object data="javascript:alert(\'XSS\')">',
    '<embed src="javascript:alert(\'XSS\')">',
    '\'><script>alert(String.fromCharCode(88,83,83))</script>',
    '<IMG SRC="javascript:alert(\'XSS\');">',
    '<IMG SRC=JaVaScRiPt:alert(\'XSS\')>',
    'eval("alert(\'XSS\')")',
    'expression(alert(\'XSS\'))'
  ],
  
  sqlInjection: [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "admin'--",
    "admin' #",
    "admin'/*",
    "' or 1=1--",
    "' or 1=1#",
    "' or 1=1/*",
    "') or '1'='1--",
    "') or ('1'='1--",
    "1' UNION SELECT NULL--",
    "1' UNION SELECT * FROM users--",
    "1'; DROP TABLE users--",
    "1'; DELETE FROM users WHERE '1'='1",
    "1' AND 1=0 UNION ALL SELECT * FROM users--"
  ],
  
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    '..%2F..%2F..%2Fetc%2Fpasswd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....\\....\\....\\windows\\system32',
    '..//..//..//etc/passwd',
    '..\\..\\..\\..\\..\\..\\windows\\system32',
    'file:///etc/passwd',
    '/etc/passwd'
  ]
};

export async function runSecurityTests() {
  const results = {
    xss: { total: 0, blocked: 0, failed: [] },
    sqlInjection: { total: 0, blocked: 0, failed: [] },
    pathTraversal: { total: 0, blocked: 0, failed: [] },
    overall: { pass: true }
  };
  
  console.log('🔒 Running Security Validation Tests...');
  console.log('');
  
  console.log('Testing XSS Detection...');
  for (const payload of MaliciousPayloads.xss) {
    results.xss.total++;
    const check = detectXSS(payload);
    if (check.safe) {
      results.xss.failed.push(payload);
      console.log(`  ❌ XSS payload not blocked: ${payload.substring(0, 50)}...`);
    } else {
      results.xss.blocked++;
    }
  }
  console.log(`  ✓ Blocked ${results.xss.blocked}/${results.xss.total} XSS payloads`);
  
  console.log('');
  console.log('Testing SQL Injection Detection...');
  for (const payload of MaliciousPayloads.sqlInjection) {
    results.sqlInjection.total++;
    const check = detectSQLInjection(payload);
    if (check.safe) {
      results.sqlInjection.failed.push(payload);
      console.log(`  ❌ SQL injection not blocked: ${payload}`);
    } else {
      results.sqlInjection.blocked++;
    }
  }
  console.log(`  ✓ Blocked ${results.sqlInjection.blocked}/${results.sqlInjection.total} SQL injection payloads`);
  
  console.log('');
  console.log('Testing Path Traversal Detection...');
  for (const payload of MaliciousPayloads.pathTraversal) {
    results.pathTraversal.total++;
    const check = detectPathTraversal(payload);
    if (check.safe) {
      results.pathTraversal.failed.push(payload);
      console.log(`  ❌ Path traversal not blocked: ${payload}`);
    } else {
      results.pathTraversal.blocked++;
    }
  }
  console.log(`  ✓ Blocked ${results.pathTraversal.blocked}/${results.pathTraversal.total} path traversal payloads`);
  
  results.overall.pass = results.xss.failed.length === 0 && 
                         results.sqlInjection.failed.length === 0 && 
                         results.pathTraversal.failed.length === 0;
  
  console.log('');
  console.log('============================================');
  if (results.overall.pass) {
    console.log('✅ ALL SECURITY TESTS PASSED');
  } else {
    console.log('❌ SECURITY TESTS FAILED');
    console.log(`Failed checks: XSS(${results.xss.failed.length}), SQL(${results.sqlInjection.failed.length}), Path(${results.pathTraversal.failed.length})`);
  }
  console.log('============================================');
  
  return results;
}

export async function testFileUploadSecurity() {
  console.log('');
  console.log('🔒 Testing File Upload Security...');
  
  const dangerousFiles = [
    { name: 'malware.exe', type: 'application/x-msdownload', size: 1024 },
    { name: 'script.sh', type: 'application/x-sh', size: 512 },
    { name: 'evil.bat', type: 'application/x-bat', size: 256 },
    { name: '../../../etc/passwd.txt', type: 'text/plain', size: 128 },
    { name: 'normal<script>.pdf', type: 'application/pdf', size: 1024 * 1024 },
    { name: 'huge.pdf', type: 'application/pdf', size: 50 * 1024 * 1024 }
  ];
  
  const results = { total: dangerousFiles.length, blocked: 0, allowed: [] };
  
  for (const file of dangerousFiles) {
    const validation = validateFileUpload(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png']
    });
    
    if (validation.valid) {
      results.allowed.push(file.name);
      console.log(`  ❌ Dangerous file allowed: ${file.name}`);
    } else {
      results.blocked++;
      console.log(`  ✓ Blocked: ${file.name} - ${validation.errors[0]}`);
    }
  }
  
  console.log(`\n  Blocked ${results.blocked}/${results.total} dangerous files`);
  
  return results;
}
