import { createFileRoute } from "@tanstack/react-router";
import { FileText, Presentation, FileType, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import filesData from "../../documents/files.json";

const FILE_ICONS: Record<string, React.ElementType> = {
  PDF: FileText,
  DOCX: FileType,
  PPTX: Presentation,
};

const FILE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  PDF: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", icon: "text-destructive" },
  DOCX: { bg: "bg-info/10", text: "text-info", border: "border-info/30", icon: "text-info" },
  PPTX: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30", icon: "text-warning" },
};

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Automated Cricket Ground Control System" },
      { name: "description", content: "Download project reports, presentations, and technical documentation." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const files = filesData.files;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Project Documents</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Reports, presentations, and technical documentation for the Automated Cricket Ground Control System.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground glass rounded-lg px-4 py-2 self-start">
          <FolderOpen className="h-4 w-4" />
          <span>{files.length} file{files.length !== 1 ? "s" : ""} available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {files.map((file) => {
          const Icon = FILE_ICONS[file.type] || FileText;
          const colors = FILE_COLORS[file.type] || FILE_COLORS.PDF;

          return (
            <div
              key={file.filename}
              className="glass rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
            >
              <div className="flex items-start gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${colors.bg} border ${colors.border}`}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm md:text-base leading-tight truncate">{file.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className={`text-xs font-medium ${colors.text} bg-transparent border ${colors.border}`}>
                      {file.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {file.description}
              </p>

              <a
                href={file.path}
                download={file.filename}
                className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
