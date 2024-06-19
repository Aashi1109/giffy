import { Button } from "@/components/ui/button";
import VideoUpload from "@/components/VideoUpload";
import { retryPromises, uploadVideoForGifGeneration } from "@/lib/helpers";
import { Loader } from "lucide-react";
import { useRef, useState } from "react";
import ReactPlayer from "react-player";
import GifOutputContainer from "./GifOutputContainer";
import { useToast } from "./ui/use-toast";

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const { toast } = useToast();

  const handleSetVideoUrl = async (videoUrl: string) => {
    setVideoUrl(videoUrl);
  };

  const handleGenerateGif = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(videoUrl);
      const blob = await response.blob();

      // Optionally, create a File object if you need to specify a filename
      const filename = videoUrl.split("/").pop(); // Extract filename from URL
      const file = new File([blob], filename ?? "", {
        type: blob.type,
      });

      // Create FormData and append the file
      const formData = new FormData();
      formData.append("video", file);

      // Send the FormData to the server
      const uploadResponse = await retryPromises(
        uploadVideoForGifGeneration(formData)
      );

      if (uploadResponse) {
        setHasSubmitted(true);
        toast({
          title: "Hooray! 🎉🎉",
          description: "Sit down while your gifs are on their way",
        });

        const { taskId } = uploadResponse?.data || {};
        if (taskId) {
          setTaskId(taskId);
        }
      }
    } catch (error: any) {
      console.error("Error submitting gif :", error);
      toast({
        title: "Error!",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    setVideoUrl("");
    setHasSubmitted(false);
  };

  return (
    <div className="flex-center flex-col p-0 sm:p-8 h-full">
      {!videoUrl ? (
        <VideoUpload setData={handleSetVideoUrl} />
      ) : (
        <div className="w-full sm:w-[45%] 2xl:w-[55%]">
          <div className="w-full flex-1 flex-col gap-4 flex">
            <ReactPlayer
              className=""
              url={videoUrl}
              width="100%"
              height="100%"
              ref={playerRef}
              controls
            />
          </div>
          <div className="flex-1 flex flex-col gap-4 p-4">
            {/* <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="name">Gif name</Label>
              <Input type="name" id="name" placeholder="Something cool ..." />
            </div>

            <div className="grid w-full max-w-sm justify-start items-center gap-1.5">
              <Label htmlFor="name">Gif maximum duration</Label>

              <ToggleGroup type="single" className="justify-start">
                <ToggleGroupItem value="15" className="rounded-md">
                  15s
                </ToggleGroupItem>
                <ToggleGroupItem value="30" className="rounded-md">
                  30s
                </ToggleGroupItem>
              </ToggleGroup>
            </div> */}
            <div className="flex-center gap-4">
              <Button
                type="button"
                disabled={hasSubmitted || isSubmitting}
                className="flex-center gap-2"
                onClick={handleGenerateGif}
              >
                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                Generate Awesome Gifs 😍
              </Button>
              <Button
                disabled={isSubmitting}
                type="button"
                variant={"outline"}
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* show fetching icon */}
        </div>
      )}
      {hasSubmitted && (
        <GifOutputContainer
          taskId={taskId ?? ""}
          resetSubmitted={() => setHasSubmitted(false)}
          generateGif={handleGenerateGif}
        />
      )}
    </div>
  );
}
