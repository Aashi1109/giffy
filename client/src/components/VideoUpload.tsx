import { cn } from "@/lib/utils";
import { Video } from "lucide-react";
import { DragEvent, useState } from "react";

const VideoUpload = ({ setData }: { setData: (data: string) => void }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    console.log("inside drag over");

    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);

    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      const fileType = file.type;

      if (fileType.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        setData(url);
      }
    }
  };
  return (
    <div
      className="flex flex-col gap-6 mb-20"
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <p className="font-medium">
        Upload your video you want to convert to gifs
      </p>

      <div
        className={cn(
          "flex-center flex-col py-10 px-20 border-2 border-dashed rounded-md gap-1",
          { "border-gray-500": isDragging, "border-gray-300": !isDragging }
        )}
      >
        {!isDragging ? (
          <>
            <Video className="h-12 w-12" />
            <p>Drag and drop video file</p>
            <p className="text-muted-foreground text-sm">or</p>
            <label htmlFor="video-input" className="mt-3">
              <span className="rounded-sm py-2 px-8 bg-foreground text-background cursor-pointer">
                Browse
              </span>
            </label>
          </>
        ) : (
          <div className="py-14">
            <p>Release to drop files</p>
          </div>
        )}
        <input
          type="file"
          multiple={false}
          className="hidden"
          id="video-input"
          name="video"
          accept="video/*"
          onChange={(e) => {
            const files = e.target?.files;
            if (files && files.length) {
              const file = files[0];
              const fileType = file.type;

              if (fileType.startsWith("video/")) {
                const url = URL.createObjectURL(file);
                setData(url);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default VideoUpload;
