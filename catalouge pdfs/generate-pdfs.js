const puppeteer = require('puppeteer')
const path = require('path')

async function generatePDF(htmlFile, pdfFile) {
  console.log(`Generating ${pdfFile}...`)

  const browser = await puppeteer.launch({
    headless: 'new'
  })

  const page = await browser.newPage()

  // Load the HTML file
  await page.goto(`file://${path.resolve(htmlFile)}`, {
    waitUntil: 'networkidle0'
  })

  // Generate PDF
  await page.pdf({
    path: pdfFile,
    format: 'A4',
    printBackground: true,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  })

  await browser.close()
  console.log(`✓ ${pdfFile} created successfully!`)
}

async function main() {
  try {
    // Generate English PDF
    await generatePDF('generate-docs-en.html', 'DumbbellFlow-User-Guide-English.pdf')

    // Generate Arabic PDF
    await generatePDF('generate-docs-ar.html', 'DumbbellFlow-User-Guide-Arabic.pdf')

    console.log('\n✅ Both PDFs generated successfully!')
    console.log('  - DumbbellFlow-User-Guide-English.pdf')
    console.log('  - DumbbellFlow-User-Guide-Arabic.pdf')
  } catch (error) {
    console.error('Error generating PDFs:', error)
    process.exit(1)
  }
}

main()
