import axios from "axios";
import { Music2 } from "lucide-react";
import TooltipWrapper from "./TooltipWrapper";

const AudioDownloader = ({
  audioUrl,
  filename,
  mimeType,
}: {
  audioUrl: string;
  mimeType: string;
  filename: string;
}) => {
  const downloadAudio = async () => {
    try {
      const response = await axios({
        url: audioUrl,
        method: "GET",
      });

      const audioBlob = new Blob([response.data], { type: mimeType });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(audioBlob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error(`Error downloading audio: ${error?.message}`);
    }
  };

  return (
    <TooltipWrapper tooltipText="Download audio only">
      <Music2 className="cursor-pointer h-5" onClick={downloadAudio} />
    </TooltipWrapper>
  );
};

export default AudioDownloader;
