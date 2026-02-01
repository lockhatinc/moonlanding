export const RFI_TEMPLATES = {
  audit: {
    name: 'Audit Information Request',
    description: 'Standard information gathering for audit engagements',
    questions: [
      {
        question: 'Please provide a list of all significant accounting policies and changes during the period',
        category: 'Accounting Policies'
      },
      {
        question: 'Please provide bank reconciliations and confirmation of cash balances as of period end',
        category: 'Cash & Banking'
      },
      {
        question: 'Please provide accounts receivable aging and bad debt analysis',
        category: 'Receivables'
      },
      {
        question: 'Please provide inventory listing, valuation methods, and count procedures',
        category: 'Inventory'
      },
      {
        question: 'Please provide property, plant and equipment register with additions and disposals',
        category: 'Fixed Assets'
      },
      {
        question: 'Please provide debt schedule including terms, covenants, and borrowing capacity',
        category: 'Liabilities'
      },
      {
        question: 'Please provide a list of legal proceedings, claims, and pending litigation',
        category: 'Contingencies'
      },
      {
        question: 'Please provide details of related party transactions and balances',
        category: 'Related Parties'
      }
    ]
  },
  tax: {
    name: 'Tax Information Request',
    description: 'Information gathering for tax compliance and planning',
    questions: [
      {
        question: 'Please provide a summary of all tax filings and payments made during the period',
        category: 'Tax Compliance'
      },
      {
        question: 'Please provide details of any tax disputes or assessments received',
        category: 'Tax Disputes'
      },
      {
        question: 'Please provide documentation of all depreciation and capital allowances claimed',
        category: 'Depreciation'
      },
      {
        question: 'Please provide details of any tax deductions or credits claimed',
        category: 'Deductions'
      },
      {
        question: 'Please provide information on intercompany transactions and pricing policies',
        category: 'Transfer Pricing'
      }
    ]
  },
  financial_review: {
    name: 'Financial Review Information Request',
    description: 'Information gathering for financial review engagements',
    questions: [
      {
        question: 'Please provide draft financial statements and trial balance',
        category: 'Financial Statements'
      },
      {
        question: 'Please provide details of any adjusting journal entries',
        category: 'Adjustments'
      },
      {
        question: 'Please provide confirmation of cash and bank balances',
        category: 'Cash Position'
      },
      {
        question: 'Please provide list of all balance sheet items requiring management estimates',
        category: 'Estimates'
      },
      {
        question: 'Please provide disclosure checklist and compliance confirmation',
        category: 'Disclosures'
      }
    ]
  },
  compliance: {
    name: 'Compliance Information Request',
    description: 'Information gathering for compliance and regulatory reviews',
    questions: [
      {
        question: 'Please provide evidence of regulatory registrations and licenses',
        category: 'Regulatory'
      },
      {
        question: 'Please provide documentation of compliance with applicable regulations',
        category: 'Compliance'
      },
      {
        question: 'Please provide details of any regulatory violations or warnings',
        category: 'Violations'
      },
      {
        question: 'Please provide board and management meeting minutes',
        category: 'Governance'
      },
      {
        question: 'Please provide details of insurance coverage and claims',
        category: 'Insurance'
      }
    ]
  },
  due_diligence: {
    name: 'Due Diligence Information Request',
    description: 'Comprehensive information gathering for due diligence reviews',
    questions: [
      {
        question: 'Please provide 3 years of audited financial statements',
        category: 'Financial History'
      },
      {
        question: 'Please provide details of all material contracts and arrangements',
        category: 'Contracts'
      },
      {
        question: 'Please provide organizational structure, ownership, and control information',
        category: 'Structure'
      },
      {
        question: 'Please provide details of all employees, payroll, and benefits',
        category: 'Personnel'
      },
      {
        question: 'Please provide details of all intellectual property, trademarks, and patents',
        category: 'IP & Intangibles'
      },
      {
        question: 'Please provide list of all material suppliers, customers, and business partners',
        category: 'Business Relationships'
      },
      {
        question: 'Please provide details of all litigation, disputes, and regulatory matters',
        category: 'Legal Matters'
      },
      {
        question: 'Please provide details of any environmental, health and safety issues',
        category: 'EHS'
      }
    ]
  }
};

export const getTemplate = (templateId) => {
  return RFI_TEMPLATES[templateId] || null;
};

export const listTemplates = () => {
  return Object.entries(RFI_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    questionCount: template.questions.length
  }));
};
