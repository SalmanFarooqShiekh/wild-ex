import { downloadCropAndSaveImage } from "../helpers/utils";

downloadCropAndSaveImage(
  "https://africancarnivore.wildbook.org/wildbook_data_dir/7/6/76a054e0-ab25-41d0-ad6b-b8c7836e24a2/I__00642.JPG",
  [386, 930, 328, 495],
  "/tmp/xyz.jpg",
);
