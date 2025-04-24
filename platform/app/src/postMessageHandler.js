import filesToStudies from './routes/Local/filesToStudies';


export function initializePostMessageListener(services, dataSources) {

  function handlePostMessage(event: MessageEvent) {

    try {
      const { type, payload } = event.data || {}

      if (type === 'DYNAMIC_PROTOCOL' && payload?.protocol && payload?.ohifId) {
        const { protocol, segSeriesUID, ohifId } = payload

        //reject other instances of ohif if the config has an ohifId
        if(window.config.ohifId && window.config.ohifId !== ohifId){
          console.warn(`Received protocol for OHIF ID ${ohifId} while this instance has OHIF ID ${window.config.ohifId} - rejecting protocol change`)
          return
        }

        //find the index of the first image with the segmentation passed with segSeriesUID
        //otherwise return 0 (first image)
        hangingProtocolService.addCustomAttribute(
          'sopInstanceLocation',
          'sopInstanceLocation',
          metadata => {
            if(!segSeriesUID){
              console.log('no segmentation series UID passed, loading first image of base series')
              return {index: 0}
            }
            let referenceInstanceUID = null

            for(const series of metadata){
              //found the segmentation that we want to show on load
              if(series.SeriesInstanceUID === segSeriesUID){
                const firstInstance = series.instances[0]

                if(firstInstance && firstInstance.ReferencedSeriesSequence && firstInstance.ReferencedSeriesSequence.length){
                  const firstReferencedSeries = firstInstance.ReferencedSeriesSequence[0]

                  if(firstReferencedSeries && firstReferencedSeries.ReferencedInstanceSequence && firstReferencedSeries.ReferencedInstanceSequence.length){
                    const firstReferencedInstance = firstReferencedSeries.ReferencedInstanceSequence[0]

                    if(firstReferencedInstance && firstReferencedInstance.ReferencedSOPInstanceUID){
                      referenceInstanceUID = firstReferencedInstance.ReferencedSOPInstanceUID || null
                      break
                    }
                  }
                }
              }
            }

            if(!referenceInstanceUID) return {index: 0}

            //find the instance referenced in the segmentation
            let instanceIndex = 0
            for(const series of metadata){
              for(const [index, instance] of Object.entries(series.instances)){
                if(instance.SOPInstanceUID === referenceInstanceUID){
                  if(instance.InstanceNumber){
                    instanceIndex = instance.InstanceNumber - 1
                  }else{
                    instanceIndex = i
                  }
                  break
                }
              }
            }

            console.log('-----instanceIndex ->', instanceIndex, metadata); return {index: instanceIndex}

          }
        )

        hangingProtocolService.addProtocol(protocol.id, protocol)
        hangingProtocolService.setProtocol(protocol.id)

        console.log(`Protocol ${protocol.id} added and activated successfully for OHIF ID: ${ohifId}`)

      } else if(type === 'ohif.fileLoad') {

        const files = payload?.files

        if (files?.length) {

          const localDataSource = dataSources.find(ds => ds.sourceName === 'dicomlocal')

          filesToStudies(files, localDataSource).then(studies => {
            console.log('Loaded studies:', studies)

            const query = new URLSearchParams()
            // Todo: navigate to work list and let user select a mode
            studies.forEach(id => query.append('StudyInstanceUIDs', id))
            query.append('datasources', 'dicomlocal');
            console.log('navigate to:', `/cliniti?${decodeURIComponent(query.toString())}`)
            const url = `/viewer?${decodeURIComponent(query.toString())}`

            // Dispatch a custom event with the files and URL
            window.dispatchEvent(
              new CustomEvent('ohif:navigateWithFiles', {
                detail: { files, url }
              })
            )
          })
        }


      } else {
        console.warn('Unrecognized message type or missing required fields')
      }

    } catch (error) {
      console.error('Error processing postMessage:', error)
    }
  }

  // Add the listener for postMessage events
  window.addEventListener('message', handlePostMessage, false)

  console.log('PostMessage listener initialized')
}
