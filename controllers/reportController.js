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
  WidthType,
} = require("docx");

const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
require("chart.js/auto");

const chartCanvas = new ChartJSNodeCanvas({
  width: 800,
  height: 500,
  backgroundColour: "white",
});

exports.generateReport = async (req, res) => {
  try {
    const d = req.body;
    const photos = req.files || [];
    const children = [];

    const heading = (text) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 360 },
        children: [
          new TextRun({
            text: (text || "").toUpperCase(),
            font: "Times New Roman",
            size: 28,
            bold: true,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
      });

    const normalText = (text, center = false) =>
      new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { line: 480 },
        children: [
          new TextRun({
            text: String(text || ""),
            font: "Times New Roman",
            size: 24,
          }),
        ],
      });

    const blank = () =>
      new Paragraph({
        text: "",
        spacing: { line: 480 },
      });

    // PAGE 1
    children.push(heading(d.collegeName));
    children.push(heading(d.departmentName));
    children.push(heading(`Camp Report – ${d.campLocation}`));
    children.push(heading(`Date: ${d.reportDateShort}`));
    children.push(blank());

    children.push(
      normalText(
        `Department of Public Health Dentistry, ${d.collegeName}, Madurai in association with ${d.associationName} and with ${d.projectName} conducted a dental screening and treatment camp at ${d.campLocation} on ${d.reportDateLong}.`
      )
    );

    children.push(
      normalText(
        `Dr R. Palanivel Pandian organised this program. The Camp started at ${d.startTime} and ended at ${d.endTime}. A team of dentists including ${d.staffCount} staff member, ${d.postgraduateCount} postgraduate member and ${d.internCount} interns member provided oral health care to the people.`
      )
    );

    children.push(
      normalText(
        `A total of ${d.totalPatients} people attended the dental camp and ${d.treatmentCount} people were treated along with oral health education and oral hygiene instructions.`
      )
    );

    children.push(new Paragraph({ children: [new PageBreak()] }));

    // PAGE 2 PHOTOS
    children.push(heading("Photos"));

    for (let i = 0; i < photos.length; i += 2) {
      const img1 = photos[i] ? photos[i].buffer : null;
      const img2 = photos[i + 1] ? photos[i + 1].buffer : null;

      children.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { line: 360 },
          children: [
            img1
              ? new ImageRun({
                  data: img1,
                  transformation: { width: 250, height: 170 },
                })
              : new TextRun(""),
            new TextRun({ text: "\t" }),
            img2
              ? new ImageRun({
                  data: img2,
                  transformation: { width: 250, height: 170 },
                })
              : new TextRun(""),
          ],
        })
      );

      children.push(blank());
    }

    children.push(new Paragraph({ children: [new PageBreak()] }));

    // CAMP STATISTICS
    const male = parseInt(d.maleCount || 0);
    const female = parseInt(d.femaleCount || 0);

    const campTable = new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 60, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [normalText("Gender", true)] }),
            new TableCell({ children: [normalText("No of Patients", true)] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [normalText("Male", true)] }),
            new TableCell({ children: [normalText(male, true)] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [normalText("Female", true)] }),
            new TableCell({ children: [normalText(female, true)] }),
          ],
        }),
      ],
    });

    const campChart = await chartCanvas.renderToBuffer({
      type: "bar",
      data: {
        labels: ["Male", "Female"],
        datasets: [
          {
            data: [male, female],
            backgroundColor: "lightblue",
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
      },
    });

    children.push(heading("Camp Statistics"));
    children.push(campTable);
    children.push(blank());

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: campChart,
            transformation: { width: 500, height: 300 },
          }),
        ],
      })
    );

    children.push(new Paragraph({ children: [new PageBreak()] }));

    // FOOTER
    const footer = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "HEAD OF THE DEPARTMENT                                      PRINCIPAL",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),
      ],
    });

    const doc = new Document({
      sections: [
        {
          footers: { default: footer },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Camp_Report.docx"
    );

    res.send(buffer);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error generating report");
  }
};
