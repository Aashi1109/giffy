import axios from "axios";
import { MonitorDown } from "lucide-react";
import TooltipWrapper from "./TooltipWrapper";

const VideoDownloader = ({
  videoUrl,
  filename,
  mimeType,
}: {
  videoUrl: string;
  filename: string;
  mimeType: string;
}) => {
  const downloadVideo = async () => {
    try {
      const response = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "blob",
      });

      const videoBlob = new Blob([response.data], { type: mimeType });
      // await convertToGif(videoBlob, filename);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(videoBlob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error(`Error downloading video: ${error?.message}`);
    }
  };

  return (
    <TooltipWrapper tooltipText="Download video">
      <MonitorDown className="cursor-pointer h-5" onClick={downloadVideo} />
    </TooltipWrapper>
  );
};

export default VideoDownloader;
