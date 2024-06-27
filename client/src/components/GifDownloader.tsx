import { convertToGif } from "@/lib/helpers";
import axios from "axios";
import { ImagePlayIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import TooltipWrapper from "./TooltipWrapper";

const GifDownloader = ({
  videoUrl,
  filename,
  mimeType,
}: {
  videoUrl: string;
  filename: string;
  mimeType: string;
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const downloadGif = async () => {
    try {
      setIsConverting(true);
      const response = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "blob",
      });

      const videoBlob = new Blob([response.data], { type: mimeType });
      await convertToGif(videoBlob, filename);
    } catch (error: any) {
      console.error(`Error downloading video: ${error?.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <TooltipWrapper tooltipText="Download gif">
      {isConverting ? (
        <Loader2 className="h-5 animate-spin" />
      ) : (
        <ImagePlayIcon className="cursor-pointer h-5" onClick={downloadGif} />
      )}
    </TooltipWrapper>
  );
};

export default GifDownloader;
