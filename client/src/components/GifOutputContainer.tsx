import config from "@/config";
import { getTaskData, retryPromises } from "@/lib/helpers";
import { EStatus, ITask } from "@/types";
import { Separator } from "@radix-ui/react-separator";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import GifOutputCard from "./GifOutputCard";
import { ToastAction } from "./ui/toast";
import { useToast } from "./ui/use-toast";

const GifOutputContainer = ({
  taskId,
  resetSubmitted,
  generateGif,
}: {
  taskId: string;
  resetSubmitted: () => void;
  generateGif: () => void;
}) => {
  const [gifData, setGifData] = useState<ITask["outputs"] | null>(null);
  const [hasGifProcessingCompleted, setHasGifProcessingCompleted] =
    useState(false);

  const { toast } = useToast();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    function main() {
      let currentIntervalCounter = 0;
      intervalId = setInterval(async () => {
        if (currentIntervalCounter >= config.maxFetchOutput) {
          resetSubmitted();
          clearInterval(intervalId);
          toast({
            title: "Error!",
            description: "Sorry 😔 we are unable to generate gifs for you.",
            variant: "destructive",
            duration: 5000,
            action: (
              <ToastAction altText="Retry" onClick={generateGif}>
                Retry
              </ToastAction>
            ),
          });
        }
        const taskResponse = await retryPromises(getTaskData(taskId));
        if (taskResponse && taskResponse.success) {
          const { data } = taskResponse;
          const isDataAvailable = data?.outputs && data?.outputs?.length;
          const isGifProcessingCompleted = data.status === EStatus.Completed;

          const isGifProcessingFailed =
            data.status === EStatus.Failed ||
            data.uploadStatus === EStatus.Failed;

          if (isGifProcessingCompleted || isGifProcessingFailed) {
            setHasGifProcessingCompleted(true);
          }

          if (isDataAvailable) {
            setGifData(data.outputs);
            currentIntervalCounter--;
          }

          if (hasGifProcessingCompleted) {
            clearInterval(intervalId);
          }
        }
        currentIntervalCounter++;
      }, config.fetchTimeout);
    }

    if (taskId) main();

    return () => {
      clearInterval(intervalId);
    };
  }, [taskId, hasGifProcessingCompleted, toast, resetSubmitted, generateGif]);

  return (
    <div className="w-full">
      <Separator />
      <p className="my-2">
        Generat{hasGifProcessingCompleted ? "ed" : "ing..."} gifs 😍
      </p>
      {!gifData ? (
        <div className="w-full h-full flex-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="gif_output_layout">
          {gifData.map((data) => (
            <GifOutputCard key={data.id} data={data} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GifOutputContainer;
