const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  PageBreak,
  UnderlineType,
  Footer,
  TabStopType,
  TabStopPosition,
  Table,
  TableRow,
  TableCell,
  WidthType
} = require("docx")

const { ChartJSNodeCanvas } = require("chartjs-node-canvas")
require("chart.js/auto")

const fs = require("fs")
const path = require("path")
const db = require("../config/db")

const chartCanvas = new ChartJSNodeCanvas({
  width: 800,
  height: 500,
  backgroundColour: "white"
})

async function createChart(config) {
  return await chartCanvas.renderToBuffer(config)
}

exports.generateReport = async (req, res) => {

  try {

    const d = req.body
    const photos = req.files || []
    const children = []

    const heading = (text) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 360 },
        children: [
          new TextRun({
            text: (text || "").toUpperCase(),
            bold: true,
            size: 28,
            font: "Times New Roman",
            underline: { type: UnderlineType.SINGLE }
          })
        ]
      })

    const normalText = (text, center=false) =>
      new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { line: 420 },
        children: [
          new TextRun({
            text: String(text || ""),
            size: 24,
            font: "Times New Roman"
          })
        ]
      })

    const blank = () => new Paragraph({ text:"" })

    // PAGE 1
    children.push(heading(d.collegeName))
    children.push(heading(d.departmentName))
    children.push(heading(`Camp Report – ${d.campLocation}`))
    children.push(heading(`Date: ${d.reportDateShort}`))
    children.push(blank())

    children.push(normalText(
      `Department of Public Health Dentistry, ${d.collegeName}, Madurai in association with ${d.associationName} and with ${d.projectName} conducted a dental screening and treatment camp at ${d.campLocation} on ${d.reportDateLong}.`
    ))

    children.push(normalText(
      `Dr R. Palanivel Pandian organised this program. The Camp started at ${d.startTime} and ended at ${d.endTime}. A team of dentists including ${d.staffCount} staff member, ${d.postgraduateCount} postgraduate member and ${d.internCount} interns member provided oral health care to the people.`
    ))

    children.push(normalText(
      `A total of ${d.totalPatients} people attended the dental camp and ${d.treatmentCount} people were treated along with oral health education and oral hygiene instructions.`
    ))

    children.push(new Paragraph({ children:[new PageBreak()] }))

    // PHOTOS
    children.push(heading("Photos"))

    for(let i=0;i<photos.length;i+=2){

      const img1 = photos[i] && fs.existsSync(photos[i].path)
        ? fs.readFileSync(photos[i].path)
        : null

      const img2 = photos[i+1] && fs.existsSync(photos[i+1].path)
        ? fs.readFileSync(photos[i+1].path)
        : null

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [

            img1 ? new ImageRun({
              data: img1,
              transformation:{width:250,height:170}
            }) : new TextRun(""),

            new TextRun({text:"    "}),

            img2 ? new ImageRun({
              data: img2,
              transformation:{width:250,height:170}
            }) : new TextRun("")
          ]
        })
      )
    }

    children.push(new Paragraph({children:[new PageBreak()]}))

    // CAMP TABLE
    const male = Number(d.maleCount||0)
    const female = Number(d.femaleCount||0)

    const campTable = new Table({
      alignment: AlignmentType.CENTER,
      width:{size:60,type:WidthType.PERCENTAGE},
      rows:[
        new TableRow({
          children:[
            new TableCell({children:[normalText("Gender",true)]}),
            new TableCell({children:[normalText("No of Patients",true)]})
          ]
        }),
        new TableRow({
          children:[
            new TableCell({children:[normalText("Male",true)]}),
            new TableCell({children:[normalText(male,true)]})
          ]
        }),
        new TableRow({
          children:[
            new TableCell({children:[normalText("Female",true)]}),
            new TableCell({children:[normalText(female,true)]})
          ]
        })
      ]
    })

    const campChart = await createChart({
      type:"bar",
      data:{
        labels:["Male","Female"],
        datasets:[{
          data:[male,female],
          backgroundColor:"lightblue"
        }]
      },
      options:{
        plugins:{legend:{display:false}},
        scales:{
          x:{title:{display:true,text:"Gender"}},
          y:{title:{display:true,text:"Number of Patients"}}
        }
      }
    })

    children.push(heading("Camp Statistics"))
    children.push(campTable)

    children.push(
      new Paragraph({
        alignment:AlignmentType.CENTER,
        children:[
          new ImageRun({
            data:campChart,
            transformation:{width:500,height:300}
          })
        ]
      })
    )

    children.push(new Paragraph({children:[new PageBreak()]}))

    // FOOTER
    const footer = new Footer({
      children:[
        new Paragraph({
          alignment:AlignmentType.CENTER,
          children:[
            new TextRun({
              text:"HEAD OF THE DEPARTMENT                                      PRINCIPAL",
              bold:true,
              size:28
            })
          ]
        })
      ]
    })

    const doc = new Document({
      sections:[{
        footers:{default:footer},
        children
      }]
    })

    const buffer = await Packer.toBuffer(doc)

    const filename = "Camp_Report_"+Date.now()+".docx"

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    res.setHeader(
      "Content-Disposition",
      "attachment; filename="+filename
    )

    res.send(buffer)

  } catch(err){
    console.error("REPORT ERROR:",err)
    res.status(500).send(err.message)
  }
}
