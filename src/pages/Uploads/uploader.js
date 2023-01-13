import React,{useState,useCallback,useMemo} from 'react'
import { Player, useAssetMetrics, useCreateAsset } from '@livepeer/react';
 import {BsFillCloudUploadFill} from "react-icons/bs"
 import { parseArweaveTxId, parseCid } from 'livepeer/media';
import { useDropzone } from 'react-dropzone';
import { bundlr } from '../../bundlrUtil';
import { providers } from "ethers";
import { WebBundlr } from "@bundlr-network/client";
import { collection, setDoc,doc,getDoc,addDoc} from  'firebase/firestore'
import { db } from '../../firebase';
import { AccountState,xmtpClientState } from '../../recoil/globalState'
import { useRecoilState ,useRecoilValue} from 'recoil'
import toast, { Toaster } from 'react-hot-toast';
var fileReaderStream = require('filereader-stream')



export default function Uploader({setTrigger}) {
    
    const [video, setVideo] = useState();
    const [title, setTitle] = useState("");
    const [description,setDescription] =useState()
    const account =useRecoilValue(AccountState)
    
    const {
        mutate: createAsset,
        data: asset,
        status,
        progress,
        error,
      } = useCreateAsset(
        video
          ? {
              sources: [{ name: video.name, file: video }] 
            }
          : null,
      );

      const { data: metrics } = useAssetMetrics({
        assetId: asset?.[0].id,
        refetchInterval: 30000,
      });
     
      const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0 && acceptedFiles?.[0]) {
          setVideo(acceptedFiles[0]);
        }
      }, []);
     
      const { getRootProps, getInputProps } = useDropzone({
        accept: {
          'video/*': ['.mp4'],
        },
        maxFiles: 1,
        onDrop,
        });


  const isLoading = useMemo(
    () =>
      status === 'loading' ||
      (asset?.[0] && asset[0].status?.phase !== 'ready'),
    [status, asset],
  );
     
        const progressFormatted = useMemo(
            () =>
              progress?.[0].phase === 'failed'
                ? 'Failed to process video.'
                : progress?.[0].phase === 'waiting'
                ? 'Waiting'
                : progress?.[0].phase === 'uploading'
                ? `Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
                : progress?.[0].phase === 'processing'
                ? `Processing: ${Math.round(progress?.[0].progress * 100)}%`
                : null,
            [progress],
          );


          const uploadToArweave=async()=>{

            try{
                const provider = new providers.Web3Provider(window.ethereum);
                await provider._ready();
        
                const bundlr = new WebBundlr("https://devnet.bundlr.network", "matic", provider,
                {
                  providerUrl: "https://polygon-mumbai.g.alchemy.com/v2/5-PAZiyQpRy1ouUxhD2vW3_KjGwxPRWi",
              }
                );
                await bundlr.ready();
        
                console.log(bundlr,"bbundlr") ;
                const price = await bundlr.getPrice(video?.size);
                console.log(price,"price")
                const priceNumber =Number(priceNumber)
             
                const funded= await bundlr.fund(priceNumber);
                toast("Funding bundlr node")
               console.log(funded,"funded")
               var readStream = fileReaderStream(video, [])
               console.log(readStream,"ssssss")
               toast("Uploading to Arweave")
               const { id } = await bundlr.upload(readStream );
              

                  console.log(`Data uploaded ==> https://arweave.net/${id}`);
                  console.log(id)

                  const docRef = await addDoc(collection(db, "videos"), {
                     
                    title,
                    description,
                    assetID:asset?.[0]?.playbackId,
                    date:Number(Date.now()),
                    creator: account,
                    videoUrl:`https://arweave.net/${id}`


                   });
                   console.log(docRef )
                   setTrigger(false)
                   setTitle("")
                   setDescription("")
            }
            catch(e){
                console.log(e)
                toast(e.message)
            }
        
          }
         console.log(video)
         console.log(asset,"asssss")
         console.log(asset?.[0]?.playbackId,"asssss")
         console.log(error)
  return (
    <>
      {asset===undefined&&
    <div {...getRootProps()} className=' w-full h-full py-32'>
          <input {...getInputProps()} />
        <div className='space-y-6 flex flex-col items-center  justify-center h-full w-full'>
            <main className='flex flex-col space-x-2 items-center'>
                <BsFillCloudUploadFill  className='text-5xl'/>
                 

                {video ? (
                    <div>{video.name}</div>
                    ) : (
                        <h5 className='text-blue-400'>Drag and drop video files to upload</h5>
               
                    )}
                {error?.message && <h5>{error.message}</h5>}
 
            </main>
             <button className='font-semibold bg-purple-700 px-2 py-1 rounded-sm text-sm'
                onClick={() => {
                    createAsset?.();
                  }}
                  size="2"
                  disabled={!createAsset || status === 'loading'}
               >
                  Upload files
             </button>
             {progressFormatted && <h5>{progressFormatted}</h5>}
        </div>
      </div>
      }
      {asset!=undefined&&
          <div className='w-full'>
            <div className='flex w-full py-6  space-x-4 '>
                <main className='w-3/5'>
                    <div className='flex flex-col space-y-8 '>
                        <h5 className='text-2xl font-normal'>Details</h5>
                         
                         <input 
                            className='bg-purple-800 px-4 h-24 text-lg rounded-md'
                            placeholder='Title'
                            onChange={(e)=>setTitle(e.target.value)}
                            name="title"
                            value={title}
                         
                         />

                         <textarea 
                            className='bg-purple-800  px-4 h-44 py-2 text-lg rounded-md'
                            placeholder='Description'
                            onChange={(e)=>setDescription(e.target.value)}
                            name="description"
                            value={description}
                         
                         />

                         <main>

                         </main>
                    </div>

                </main>
                <main className='w-2/5 '>
                    <h5>Filename :{video?.name}</h5>
                    <div className='py-10'>
                    <Player title={asset?.[0]?.name} playbackId={asset?.[0]?.playbackId} />
                    </div>
                  
                </main>


            </div>
              <main>
                  <button className='bg-purple-700 px-2 py-2 text-sm rounded-md'
                    onClick={ uploadToArweave}
                  >
                    Upload to Arweave
                </button>

              </main>
            </div>
         }

   
  
    </>
  )
}
