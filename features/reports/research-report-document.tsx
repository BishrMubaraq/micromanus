import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export type ResearchReportDocumentProps = {
  title: string;
  content: string;
  createdAt?: string;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111111",
    lineHeight: 1.5,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#666666",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  meta: {
    fontSize: 9,
    color: "#777777",
    marginBottom: 24,
  },
  paragraph: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 8,
  },
  bullet: {
    marginLeft: 12,
    marginBottom: 4,
  },
});

function renderBlocks(content: string) {
  return content.split("\n").map((line, index) => {
    if (line.startsWith("## ")) {
      return (
        <Text key={index} style={styles.heading}>
          {line.replace(/^##\s+/, "")}
        </Text>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <Text key={index} style={styles.bullet}>
          • {line.replace(/^-\s+/, "")}
        </Text>
      );
    }
    if (!line.trim()) {
      return <View key={index} style={{ height: 6 }} />;
    }
    return (
      <Text key={index} style={styles.paragraph}>
        {line}
      </Text>
    );
  });
}

export function ResearchReportDocument({
  title,
  content,
  createdAt,
}: ResearchReportDocumentProps) {
  return (
    <Document title={title} author="MicroManus">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>MicroManus Report</Text>
        <Text style={styles.title}>{title}</Text>
        {createdAt ? (
          <Text style={styles.meta}>
            Generated {new Date(createdAt).toLocaleString()}
          </Text>
        ) : null}
        <View>{renderBlocks(content)}</View>
      </Page>
    </Document>
  );
}
