import * as React from "react";
import { ChangeEvent, useEffect, useState } from "react";
import FullScreenSpinner from "./full-screen-spinner";
import { toast, ToastContainer } from "react-toastify";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import * as Icon from "react-bootstrap-icons";
import * as path from "path";

const Dashboard = () => {
  const defaultNumAnnotationsPerId = "4";

  const [modalShow, setModalShow] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [downloadsDirectory, setDownloadsDirectory] = useState("");
  const [currentFormData, setCurrentFormData] = useState<
    SubmitData & { handleFinalSubmit: boolean }
  >({
    downloadRoot: "",
    inputXlsx: "",
    unidentifiedEncounters: false,
    numAnnotationsPerId: defaultNumAnnotationsPerId,
    handleFinalSubmit: false,
  });

  useEffect(() => {
    window.electron.getDownloadsDirectory((downloadsDirectory: string) => {
      setDownloadsDirectory(downloadsDirectory);
      setCurrentFormData((previous) => {
        return {
          ...previous,
          downloadRoot: downloadsDirectory,
        };
      });
    });
  }, []);

  useEffect(() => {
    if (currentFormData.handleFinalSubmit) {
      handleFinalSubmit();
    }
  }, [currentFormData.handleFinalSubmit]);

  const handleFinalSubmit = async () => {
    setShowSpinner(true);

    setCurrentFormData((previous) => {
      return {
        ...previous,
        handleFinalSubmit: false,
      };
    });

    const done: Done = await window.electron.handleFinalSubmit(currentFormData);

    if (done.success) {
      toast.success(done.message);
    } else {
      toast.error(done.message);
    }

    setShowSpinner(false);
  };

  const openXlsxDialog = (): void => {
    window.electron.openXlsxDialog((selectedFile: string) => {
      setCurrentFormData((previous) => {
        return {
          ...previous,
          inputXlsx: selectedFile,
        };
      });
    }, currentFormData.inputXlsx || downloadsDirectory);
  };

  const openDirectoryDialog = (): void => {
    if (formDataValid()) {
      window.electron.openDirectoryDialog((selectedDirectory: string) => {
        setCurrentFormData((previous) => {
          return {
            ...previous,
            downloadRoot: selectedDirectory,
            handleFinalSubmit: true,
          };
        });
      }, currentFormData.downloadRoot);
    }
  };

  const formDataValid = (): boolean => {
    if (!currentFormData.inputXlsx) {
      toast.error("Excel file empty!");
      return false;
    }
    // if (!currentFormData.field1.good) return false;
    // if (!currentFormData.field2.good) return false;
    // if (!currentFormData.field3.good) return false;
    return true;
  };

  const unidentifiedEncountersOnChange = (e: ChangeEvent<HTMLButtonElement>): void => {
    setCurrentFormData((previous) => {
      return {
        ...previous,
        unidentifiedEncounters: e.target.value === "yes",
      };
    });
  };

  return (
    <>
      <div>
        <div
          className={"d-flex"}
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <h1 className={"fw-bolder"}>WildEx</h1>

          <p>Download Annotated Images from Wildbook</p>

          <Form spellCheck={false}>
            <ol className={"main-list"}>
              <li>
                Generate & save Encounter Annotations Export file from Wildbook Encounter Search
              </li>

              <li>
                <div>Select Annotation export file:</div>

                <InputGroup className={"mt-1"}>
                  <Form.Control
                    onClick={openXlsxDialog}
                    readOnly={true}
                    type="text"
                    value={path.basename(currentFormData.inputXlsx)}
                  />
                  <Button variant={"secondary"} onClick={openXlsxDialog}>
                    <Icon.FiletypeXls title={"Select input .xls file"}></Icon.FiletypeXls>
                  </Button>
                </InputGroup>
              </li>

              <li>
                <div className={"d-flex align-items-center"}>
                  <div>Include unidentified encounters in export? (Default is No)</div>

                  <div key={"inline-radio"} className="ms-4 mt-1">
                    <Form.Check
                      inline
                      label="No"
                      value={"no"}
                      name="unidentifiedEncounters"
                      type={"radio"}
                      checked={!currentFormData.unidentifiedEncounters}
                      onChange={unidentifiedEncountersOnChange}
                    />
                    <Form.Check
                      inline
                      label="Yes"
                      value={"yes"}
                      name="unidentifiedEncounters"
                      type={"radio"}
                      checked={currentFormData.unidentifiedEncounters}
                      onChange={unidentifiedEncountersOnChange}
                    />
                  </div>
                </div>
              </li>

              <li>
                <div>
                  Select # of annotations per Individual ID
                  <div
                    style={{
                      fontSize: "0.8rem",
                    }}
                    className={"mt-2"}
                  >
                    Default is <u>one each</u> of viewpoints: left, right, front, back (unless
                    export filters excluded viewpoints)
                    <ul className={"mt-1"}>
                      <li>
                        If not available, next available similar viewpoint is selected (ex.
                        leftfront, rightback)
                      </li>

                      <li>
                        If 2 annotations per individual is selected, 1 left & 1 right will be
                        exported per individual ID, where available
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={"d-flex flex-row justify-content-center align-items-start mt-4"}>
                  <Form.Select
                    style={{
                      width: "6rem",
                      position: "absolute",
                      left: "10rem",
                    }}
                    className={"me-4"}
                    onChange={(e) => {
                      setCurrentFormData((previous) => {
                        return {
                          ...previous,
                          numAnnotationsPerId: e.target.value,
                        };
                      });

                      if (e.target.value === "all") {
                        setModalShow(true);
                      }
                    }}
                  >
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "All"].map((i) => (
                      <option
                        value={i.toLowerCase()}
                        selected={currentFormData.numAnnotationsPerId === i.toLowerCase()}
                      >
                        {i}
                      </option>
                    ))}
                  </Form.Select>

                  <div className={"d-flex flex-column align-items-center"}>
                    <div style={{ width: "20rem", transform: "translate(4rem)" }}>
                      <h5 className={"text-danger fw-semibold mb-0"}>Warning</h5>
                      <div className={"text-danger"}>
                        Consider your internet connection as well as the number of encounters and
                        annotations in the source Export file before selecting the number of images
                        per individual in download
                      </div>
                    </div>

                    <Button
                      variant={"primary"}
                      style={{
                        fontSize: "1.4rem",
                        width: "12rem",
                      }}
                      className={"mt-4"}
                      onClick={() => {
                        if (currentFormData.numAnnotationsPerId === "all") {
                          setModalShow(true);
                        } else {
                          openDirectoryDialog();
                        }
                      }}
                    >
                      Download Annotations
                    </Button>
                  </div>
                </div>
              </li>
            </ol>
          </Form>
        </div>
      </div>

      <Modal
        show={modalShow}
        onHide={() => {
          setModalShow(false);
        }}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body className={"modal-body"}>
          <div>
            You have selected "All" to download <b>ALL</b> annotations for <b>ALL</b> encounters in
            the Encounter Annotations Export file selected.
          </div>

          <div>
            This may take a <b>LONG</b> time and use <b>A LOT</b> of internet bandwidth.
          </div>

          <div>
            It could also use <b>MORE</b> storage space than is available on the drive you are
            downloading to.
          </div>

          <div>
            To <b>REDUCE</b> the size of your image download, create a smaller export file from
            Wildbook, using filters to narrow your search results. Or, click "Go Back" below to
            select a lower number of annotations for download.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={() => {
              setModalShow(false);
              openDirectoryDialog();
            }}
          >
            Download ALL annotations
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setModalShow(false);
              setCurrentFormData((previous) => {
                return {
                  ...previous,
                  numAnnotationsPerId: defaultNumAnnotationsPerId,
                };
              });
            }}
          >
            GO BACK
          </Button>
        </Modal.Footer>
      </Modal>

      <FullScreenSpinner show={showSpinner} />

      <ToastContainer
        position={"top-right"}
        autoClose={5000}
        limit={6}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
        theme={"light"}
      />
    </>
  );
};

export default Dashboard;
