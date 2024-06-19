import { ITask } from "@/types";
import ReactPlayer from "react-player";
import AudioDownloader from "./AudioDownloader";
import { Card, CardContent } from "./ui/card";
import VideoDownloader from "./VideoDownloader";

const GifOutputCard = ({ data }: { data: ITask["outputs"][0] }) => {
  const { video, audio, text } = data;
  // const { toast } = useToast();
  // const handleDelete = async () => {
  //   const response = await axios.get(config.apiUrl + "/giffytask/" + id);
  //   if (response.statusText === "ok") {
  //     toast({
  //       title: "Deletion success",
  //       description: "Gif has been deleted successfully",
  //     });
  //   }
  // };
  return (
    <Card className="w-full sm:w-[250px] break-inside-avoid">
      {/* <CardHeader></CardHeader> */}
      <CardContent className="flex flex-col gap-2 pt-6">
        <ReactPlayer width={"100%"} height={"auto"} url={video.path} controls />
        <p className="text-wrap">{text}</p>
        <div className="flex gap-4 justify-end">
          <VideoDownloader
            videoUrl={video.path}
            filename={text}
            mimeType={video.mimeType as string}
          />
          <AudioDownloader
            audioUrl={audio.path}
            filename={text}
            mimeType={audio.mimeType}
          />
          {/* <TooltipWrapper tooltipText="Delete gif">
            <Trash2
              className="cursor-pointer text-destructive  h-5"
              onClick={handleDelete}
            />
          </TooltipWrapper> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default GifOutputCard;
