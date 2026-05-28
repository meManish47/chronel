from langfuse import Langfuse
from dotenv import load_dotenv
import inspect

load_dotenv()

lf = Langfuse()

obs = lf.start_observation(
    name="test",
    as_type="retriever"
)

print(type(obs))
print(inspect.signature(obs.update))